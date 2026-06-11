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

// Sent to contact form submitter immediately after submission
export const sendContactConfirmation = internalAction({
  args: {
    to: v.string(),
    name: v.string(),
    appName: v.string(),
    supportEmail: v.string(),
  },
  handler: async (_ctx, { to, name, appName, supportEmail }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — contact confirmation not sent");
      return null;
    }
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getFrom(),
      to,
      subject: `We received your message, ${name}`,
      html: `
        <h2>Thanks for reaching out, ${name}!</h2>
        <p>We've received your message and will get back to you within one business day.</p>
        <p>If you have urgent questions, reply to this email or contact us at
           <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
        <p>— The ${appName} team</p>
      `,
      text: `Thanks for reaching out, ${name}! We received your message and will reply within one business day. Urgent? Contact us at ${supportEmail}.`,
    });
    if (error) console.error("sendContactConfirmation error:", error);
    return null;
  },
});

// Sent to visitor immediately after a booking is confirmed
export const sendBookingConfirmation = internalAction({
  args: {
    to: v.string(),
    name: v.string(),
    linkName: v.string(),
    date: v.string(),
    startTime: v.string(),
    duration: v.number(),
    appName: v.string(),
    supportEmail: v.string(),
    bookingId: v.optional(v.string()),
    siteUrl: v.optional(v.string()),
  },
  handler: async (_ctx, { to, name, linkName, date, startTime, duration, appName, supportEmail, bookingId, siteUrl }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn("RESEND_API_KEY not set — booking confirmation not sent");
      return null;
    }

    const [y, mo, d] = date.split("-").map(Number);
    const formattedDate = new Date(y, mo - 1, d).toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const [h, m] = startTime.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    const formattedTime = `${h12}:${String(m).padStart(2, "0")} ${period}`;

    // Generate cancellation link if bookingId and siteUrl are available
    let cancelLink = "";
    if (bookingId && siteUrl) {
      const { createHmac } = await import("crypto");
      const secret = process.env.CANCEL_SECRET ?? "dev-secret";
      const cancelToken = createHmac("sha256", secret).update(`cancel:${bookingId}`).digest("hex");
      cancelLink = `<p style="margin-top:20px;padding-top:20px;border-top:1px solid #e5e7eb;"><a href="${siteUrl}/bookings/cancel?bookingId=${bookingId}&token=${cancelToken}" style="color:#94a3b8;font-size:13px;">Cancel this booking</a></p>`;
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getFrom(),
      to,
      subject: `Booking confirmed — ${linkName}`,
      html: `
        <h2>You're booked, ${name}!</h2>
        <p><strong>${linkName}</strong></p>
        <p>📅 ${formattedDate}<br/>🕐 ${formattedTime} (${duration} min)</p>
        <p>Need to reschedule? Reply to this email or contact us at
           <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
        <p>— The ${appName} team</p>
        ${cancelLink}
      `,
      text: `You're booked, ${name}! ${linkName} on ${formattedDate} at ${formattedTime} (${duration} min). To reschedule: ${supportEmail}`,
    });
    if (error) console.error("sendBookingConfirmation error:", error);
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
