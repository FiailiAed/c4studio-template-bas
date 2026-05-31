"use node";

import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { v } from "convex/values";
import { Resend } from "resend";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured in Convex env vars");
  return new Resend(apiKey);
}

function getFrom(): string {
  return process.env.RESEND_FROM_EMAIL ?? "noreply@resend.dev";
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Called internally by contacts.create and users.createOrUpdate — no auth check needed
export const sendAdminAlert = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — email not sent");
      return null;
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: args.to,
      subject: args.subject,
      html: args.html,
      text: stripHtml(args.html),
    });

    if (error) console.error("Resend sendAdminAlert error:", error);
    return null;
  },
});

// Admin: send a one-off email to a single recipient
export const sendEmail = action({
  args: {
    to: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
    templateId: v.optional(v.id("emailTemplates")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(api.users.getByClerkId, { clerkId: identity.subject });
    if (!user || user.role !== "admin") throw new Error("Admin access required");

    const resend = getResend();
    const { error } = await resend.emails.send({
      from: getFrom(),
      to: args.to,
      subject: args.subject,
      html: args.htmlBody,
      text: stripHtml(args.htmlBody),
    });

    if (error) throw new Error(`Resend error: ${(error as { message?: string }).message ?? "Unknown error"}`);

    await ctx.runMutation(internal.emailLogs.create, {
      type: "single",
      recipients: [args.to],
      subject: args.subject,
      templateId: args.templateId,
      sentByClerkId: identity.subject,
      recipientCount: 1,
    });

    return null;
  },
});

// Admin: send an email to all registered users (batch)
export const sendBroadcast = action({
  args: {
    subject: v.string(),
    htmlBody: v.string(),
    templateId: v.optional(v.id("emailTemplates")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.runQuery(api.users.getByClerkId, { clerkId: identity.subject });
    if (!user || user.role !== "admin") throw new Error("Admin access required");

    const users = await ctx.runQuery(api.users.list, {});
    if (users.length === 0) throw new Error("No registered users to send to");

    const resend = getResend();
    const from = getFrom();
    const text = stripHtml(args.htmlBody);

    const messages = users.map((u) => ({
      from,
      to: u.email,
      subject: args.subject,
      html: args.htmlBody,
      text,
    }));

    const { error } = await resend.batch.send(messages);

    if (error) throw new Error(`Resend batch error: ${(error as { message?: string }).message ?? "Unknown error"}`);

    await ctx.runMutation(internal.emailLogs.create, {
      type: "broadcast",
      recipients: users.map((u) => u.email),
      subject: args.subject,
      templateId: args.templateId,
      sentByClerkId: identity.subject,
      recipientCount: users.length,
    });

    return null;
  },
});
