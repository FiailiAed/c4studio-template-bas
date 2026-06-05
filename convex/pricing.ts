import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("pricingTiers")
      .withIndex("by_order")
      .order("asc")
      .take(50);
  },
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("pricingTiers")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(50);
    return [...items].sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.string(),
    billingPeriod: v.union(
      v.literal("monthly"),
      v.literal("annual"),
      v.literal("one_time"),
      v.literal("custom")
    ),
    priceLabel: v.optional(v.string()),
    features: v.array(v.string()),
    highlighted: v.boolean(),
    ctaLabel: v.string(),
    ctaHref: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.db.insert("pricingTiers", {
      ...args,
      published: false,
      order: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("pricingTiers"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.optional(v.string()),
    billingPeriod: v.optional(
      v.union(
        v.literal("monthly"),
        v.literal("annual"),
        v.literal("one_time"),
        v.literal("custom")
      )
    ),
    priceLabel: v.optional(v.string()),
    features: v.optional(v.array(v.string())),
    highlighted: v.optional(v.boolean()),
    ctaLabel: v.optional(v.string()),
    ctaHref: v.optional(v.string()),
    published: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("pricingTiers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    await ctx.db.delete(args.id);
  },
});
