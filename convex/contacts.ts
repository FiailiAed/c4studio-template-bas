import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Rate limit: one submission per email per 5 minutes
    const recent = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .first();
    if (recent && Date.now() - recent._creationTime < 5 * 60 * 1000) {
      throw new Error("RATE_LIMITED");
    }

    const id = await ctx.db.insert("contacts", { ...args, read: false });

    const settings = await ctx.db.query("appSettings").first();
    if (settings?.notifyOnContact && settings.adminAlertEmail) {
      await ctx.scheduler.runAfter(0, internal.email.sendAdminAlert, {
        to: settings.adminAlertEmail,
        subject: `New contact from ${args.name}`,
        html: `
          <h2>New contact form submission</h2>
          <p><strong>Name:</strong> ${args.name}</p>
          <p><strong>Email:</strong> ${args.email}</p>
          ${args.subject ? `<p><strong>Subject:</strong> ${args.subject}</p>` : ""}
          <p><strong>Message:</strong></p>
          <p>${args.message.replace(/\n/g, "<br>")}</p>
        `,
      });
    }

    return id;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contacts").order("desc").take(100);
  },
});

export const listUnread = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("contacts")
      .withIndex("by_read", (q) => q.eq("read", false))
      .order("desc")
      .take(100);
  },
});

export const markRead = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contactId, { read: true });
  },
});

export const remove = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.contactId);
  },
});
