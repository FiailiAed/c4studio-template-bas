import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = internalMutation({
  args: {
    type: v.union(v.literal("single"), v.literal("broadcast")),
    recipients: v.array(v.string()),
    subject: v.string(),
    templateId: v.optional(v.id("emailTemplates")),
    sentByClerkId: v.string(),
    recipientCount: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("emailLogs", args);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("emailLogs").order("desc").take(100);
  },
});
