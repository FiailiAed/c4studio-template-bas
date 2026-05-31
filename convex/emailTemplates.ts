import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("emailTemplates").order("asc").take(100);
  },
});

export const get = query({
  args: { id: v.id("emailTemplates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailTemplates", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("emailTemplates"),
    name: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("emailTemplates") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
