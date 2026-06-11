import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("appSettings").first();
  },
});

export const upsert = mutation({
  args: {
    appName: v.optional(v.string()),
    siteUrl: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    description: v.optional(v.string()),
    maintenanceMode: v.optional(v.boolean()),
    registrationEnabled: v.optional(v.boolean()),
    blogEnabled: v.optional(v.boolean()),
    adminAlertEmail: v.optional(v.string()),
    notifyOnContact: v.optional(v.boolean()),
    notifyOnNewUser: v.optional(v.boolean()),
    primaryColor: v.optional(v.string()),
    primaryName: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    secondaryName: v.optional(v.string()),
    tertiaryColor: v.optional(v.string()),
    tertiaryName: v.optional(v.string()),
    neutralColor: v.optional(v.string()),
    neutralName: v.optional(v.string()),
    googleReviewUrl: v.optional(v.string()),
    primaryService: v.optional(v.string()),
    defaultBookingLink: v.optional(v.string()),
    rafflePrize: v.optional(v.string()),
    raffleLink: v.optional(v.string()),
    feedbackFormLink: v.optional(v.string()),
    referralShareLink: v.optional(v.string()),
    referralIntroOffer: v.optional(v.string()),
    outscraperApiKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("appSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("appSettings", args);
    }
  },
});

export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("appSettings").first();
    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
