import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("testimonials").order("desc").take(200);
  },
});

export const listApproved = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("testimonials")
      .withIndex("by_approved", (q) => q.eq("approved", true))
      .order("desc")
      .take(100);
  },
});

export const create = mutation({
  args: {
    authorName: v.string(),
    authorTitle: v.optional(v.string()),
    body: v.string(),
    rating: v.number(),
    featured: v.boolean(),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("testimonials", args);
  },
});

export const setApproved = mutation({
  args: { testimonialId: v.id("testimonials"), approved: v.boolean() },
  handler: async (ctx, args) => {
    const patch: { approved: boolean; featured?: boolean } = { approved: args.approved };
    if (!args.approved) patch.featured = false;
    await ctx.db.patch(args.testimonialId, patch);
  },
});

export const setFeatured = mutation({
  args: { testimonialId: v.id("testimonials"), featured: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.testimonialId, { featured: args.featured });
  },
});

export const remove = mutation({
  args: { testimonialId: v.id("testimonials") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.testimonialId);
  },
});
