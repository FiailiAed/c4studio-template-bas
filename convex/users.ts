import { mutation, query } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";

// Called from onboarding. Derives identity server-side — never accepts userId from client.
export const createOrUpdate = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const clerkId = identity.subject;
    const tokenIdentifier = identity.tokenIdentifier;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        tokenIdentifier,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId,
      tokenIdentifier,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      role: "user",
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").order("asc").take(100);
  },
});

export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("user")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const remove = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.userId);
  },
});

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

// Admin: fetches all users and their Stripe subscriptions, payments, and invoices.
export const adminGetBillingData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!admin || admin.role !== "admin") return null;

    const users = await ctx.db.query("users").order("asc").take(100);

    const rows = await Promise.all(
      users.map(async (user) => {
        if (!user.tokenIdentifier) {
          return { user, subscriptions: [], payments: [], invoices: [] };
        }
        const [subscriptions, payments, invoices] = await Promise.all([
          ctx.runQuery(components.stripe.public.listSubscriptionsByUserId, {
            userId: user.tokenIdentifier,
          }),
          ctx.runQuery(components.stripe.public.listPaymentsByUserId, {
            userId: user.tokenIdentifier,
          }),
          ctx.runQuery(components.stripe.public.listInvoicesByUserId, {
            userId: user.tokenIdentifier,
          }),
        ]);
        return { user, subscriptions, payments, invoices };
      })
    );

    return rows;
  },
});
