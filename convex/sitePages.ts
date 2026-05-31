import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listStatuses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sitePages").collect();
  },
});

export const setStatus = mutation({
  args: {
    route: v.string(),
    status: v.union(v.literal("active"), v.literal("planned"), v.literal("hidden")),
  },
  handler: async (ctx, { route, status }) => {
    const existing = await ctx.db
      .query("sitePages")
      .withIndex("by_route", (q) => q.eq("route", route))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { status });
    } else {
      await ctx.db.insert("sitePages", { route, status });
    }
  },
});
