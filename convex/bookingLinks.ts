import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("bookingLinks").order("desc").take(100);
  },
});

export const get = query({
  args: { id: v.id("bookingLinks") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query("bookingLinks")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    published: v.boolean(),
    headline: v.optional(v.string()),
    subheadline: v.optional(v.string()),
    duration: v.optional(v.number()),
    bufferTime: v.optional(v.number()),
    availabilityStart: v.optional(v.string()),
    availabilityEnd: v.optional(v.string()),
    availableDays: v.optional(v.array(v.number())),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bookingLinks", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("bookingLinks"),
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    published: v.boolean(),
    headline: v.optional(v.string()),
    subheadline: v.optional(v.string()),
    duration: v.optional(v.number()),
    bufferTime: v.optional(v.number()),
    availabilityStart: v.optional(v.string()),
    availabilityEnd: v.optional(v.string()),
    availableDays: v.optional(v.array(v.number())),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("bookingLinks") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
