import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return ctx.db.query("devTasks").order("asc").collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    status: v.string(),
    priority: v.string(),
    version: v.optional(v.string()),
    category: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("devTasks").collect();
    const nextId = all.length > 0 ? Math.max(...all.map((t) => t.taskId)) + 1 : 81;
    return ctx.db.insert("devTasks", { ...args, taskId: nextId });
  },
});

export const update = mutation({
  args: {
    id: v.id("devTasks"),
    title: v.string(),
    status: v.string(),
    priority: v.string(),
    version: v.optional(v.string()),
    category: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("devTasks"),
    status: v.string(),
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, { status });
  },
});

export const remove = mutation({
  args: { id: v.id("devTasks") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
