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

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    published: v.boolean(),
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
