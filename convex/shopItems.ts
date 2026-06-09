import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByShop = query({
  args: { shopId: v.id("shops") },
  handler: async (ctx, { shopId }) => {
    return await ctx.db
      .query("shopItems")
      .withIndex("by_shop", (q) => q.eq("shopId", shopId))
      .order("asc")
      .take(100);
  },
});

export const create = mutation({
  args: {
    shopId: v.id("shops"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    currency: v.string(),
    stripePriceId: v.string(),
    imageUrl: v.optional(v.string()),
    published: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("shopItems", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("shopItems"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    currency: v.string(),
    stripePriceId: v.string(),
    imageUrl: v.optional(v.string()),
    published: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("shopItems") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
