import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.storage.generateUploadUrl();
  },
});

export const listWithUrls = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("gallery")
      .withIndex("by_order")
      .order("asc")
      .take(100);
    return await Promise.all(
      items.map(async (item) => ({
        ...item,
        url: await ctx.storage.getUrl(item.storageId),
      }))
    );
  },
});

export const listPublishedWithUrls = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("gallery")
      .withIndex("by_published", (q) => q.eq("published", true))
      .take(100);
    const sorted = [...items].sort((a, b) => a.order - b.order);
    return await Promise.all(
      sorted.map(async (item) => ({
        ...item,
        url: await ctx.storage.getUrl(item.storageId),
      }))
    );
  },
});

export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    mediaType: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("pdf")
    ),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    return await ctx.db.insert("gallery", {
      ...args,
      order: Date.now(),
      published: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("gallery"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
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
  args: { id: v.id("gallery") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    const item = await ctx.db.get(args.id);
    if (!item) return;
    await ctx.storage.delete(item.storageId);
    await ctx.db.delete(args.id);
  },
});
