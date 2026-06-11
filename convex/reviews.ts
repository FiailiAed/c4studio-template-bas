import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ─── Default message templates (from .devnotes/drc-reviews-and-referrals.md) ─

const DEFAULT_MESSAGES = [
  {
    messageKey: "r1",
    label: "Rating Request",
    triggerDescription: "Auto-fires 2 hours after scheduled appointment time",
    smsBody: "{{BUSINESS_NAME}} here. How'd today's session feel, 1 to 5? Reply with a number and you're in this quarter's draw for {{RAFFLE_PRIZE}}.",
    emailSubject: "How'd that session land?",
    emailBody: "{{FIRST_NAME}},\n\nQuick one — how did today's session feel? Just reply with a number, 1 to 5.\n\nReplying drops your name into this quarter's drawing for {{RAFFLE_PRIZE}}. I pull a winner at the end of the quarter.\n\nAppreciate you taking ten seconds on it.\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    messageType: "automated" as const,
    order: 1,
  },
  {
    messageKey: "r2",
    label: "5-Star Response (rated 4–5)",
    triggerDescription: "Fires when customer rates 4 or 5 — requires inbound SMS/email response",
    smsBody: "Love it — thank you! Your raffle entry for {{RAFFLE_PRIZE}} is locked in. Got 30 secs? A Google review means a ton: {{GOOGLE_REVIEW_LINK}}",
    emailSubject: "That made my day",
    emailBody: "{{FIRST_NAME}},\n\nThat's great to hear — thank you.\n\nYour entry for this quarter's {{RAFFLE_PRIZE}} is locked in.\n\nOne favor if you've got 30 seconds: a quick Google review helps other families find us more than just about anything else I can do. Here's the link → {{GOOGLE_REVIEW_LINK}}\n\nThanks for being part of this.\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    messageType: "automated" as const,
    order: 2,
  },
  {
    messageKey: "r3",
    label: "1–3 Star Response (rated 1–3)",
    triggerDescription: "Fires when customer rates 1, 2, or 3 — requires inbound SMS/email response",
    smsBody: "Thanks for the honest score. I want to know what missed — mind sharing here? {{FEEDBACK_FORM_LINK}} Your raffle entry is still in.",
    emailSubject: "Want to hear what missed",
    emailBody: "{{FIRST_NAME}},\n\nThanks for being straight with me — I'd rather know.\n\nIf you've got a minute, tell me what didn't hit so I can actually fix it: {{FEEDBACK_FORM_LINK}}\n\nA manager will also reach out directly to make it right.\n\nAnd your entry for {{RAFFLE_PRIZE}} is still locked in — that doesn't change.\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    messageType: "automated" as const,
    order: 3,
  },
  {
    messageKey: "r4",
    label: "Referral Ask (after 5-star Google review)",
    triggerDescription: "Fires after customer posts a public 5-star Google review — manual trigger",
    smsBody: "Saw your review — seriously, thank you. Want better odds on {{RAFFLE_PRIZE}}? Send friends this: {{REFERRAL_SHARE_LINK}}. Each one who books adds 5 entries for you.",
    emailSubject: "Saw your review — and a way to stack your odds",
    emailBody: "{{FIRST_NAME}},\n\nSaw the review you left — that genuinely means a lot, thank you.\n\nSince you're already in this quarter's draw for {{RAFFLE_PRIZE}}, here's a way to boost your own odds: send this link to anyone you think would be interested → {{REFERRAL_SHARE_LINK}}. It drops them into {{REFERRAL_INTRO_OFFER}}.\n\nEvery friend who books adds 5 extra entries under your name.\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    messageType: "automated" as const,
    order: 4,
  },
  // ─── R5 Auto-response templates (copy-paste for Google review replies) ──────
  {
    messageKey: "r5a",
    label: "Google Review Reply #1",
    triggerDescription: "Copy and paste this reply to a 5-star Google review",
    smsBody: "",
    emailSubject: "",
    emailBody: "Thanks {{CUSTOMER_FIRST_NAME}}! Watching the work click into place this season has been the best part of my week. See you at the next one.",
    enabled: true,
    channel: "email" as const,
    messageType: "template" as const,
    order: 5,
  },
  {
    messageKey: "r5b",
    label: "Google Review Reply #2",
    triggerDescription: "Copy and paste this reply to a 5-star Google review",
    smsBody: "",
    emailSubject: "",
    emailBody: "Appreciate you, {{CUSTOMER_FIRST_NAME}}. We put a lot into building real fundamentals — not just drills for show — so it means a lot that it's showing up for you.",
    enabled: true,
    channel: "email" as const,
    messageType: "template" as const,
    order: 6,
  },
  {
    messageKey: "r5c",
    label: "Google Review Reply #3",
    triggerDescription: "Copy and paste this reply to a 5-star Google review",
    smsBody: "",
    emailSubject: "",
    emailBody: "{{CUSTOMER_FIRST_NAME}}, this made me smile. Families like yours are exactly why I started {{BUSINESS_NAME}} — thank you for trusting us.",
    enabled: true,
    channel: "email" as const,
    messageType: "template" as const,
    order: 7,
  },
  {
    messageKey: "r5d",
    label: "Google Review Reply #4",
    triggerDescription: "Copy and paste this reply to a 5-star Google review",
    smsBody: "",
    emailSubject: "",
    emailBody: "Thank you, {{CUSTOMER_FIRST_NAME}}! The 1-on-1 work is where I see the biggest jumps, and you put in the reps to earn it. Pumped for what's next.",
    enabled: true,
    channel: "email" as const,
    messageType: "template" as const,
    order: 8,
  },
  {
    messageKey: "r5e",
    label: "Google Review Reply #5",
    triggerDescription: "Copy and paste this reply to a 5-star Google review",
    smsBody: "",
    emailSubject: "",
    emailBody: "Means a lot, {{CUSTOMER_FIRST_NAME}}. Getting every person a little better each session is the whole goal here. Catch you on the field.",
    enabled: true,
    channel: "email" as const,
    messageType: "template" as const,
    order: 9,
  },
] as const;

// ─── Internal query helpers ───────────────────────────────────────────────────

export const getMessageByKey = internalQuery({
  args: { messageKey: v.string() },
  handler: async (ctx, { messageKey }) =>
    ctx.db
      .query("reviewsMessages")
      .withIndex("by_message_key", (q) => q.eq("messageKey", messageKey))
      .unique(),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

export const listMessages = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("reviewsMessages").order("asc").take(20),
});

export const listLogs = query({
  args: {
    messageKey: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { messageKey, limit }) => {
    if (messageKey) {
      return ctx.db
        .query("reviewsLogs")
        .withIndex("by_message_key", (q) => q.eq("messageKey", messageKey))
        .order("desc")
        .take(limit ?? 50);
    }
    return ctx.db.query("reviewsLogs").order("desc").take(limit ?? 100);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("reviewsLogs").order("desc").take(2000);
    const stats: Record<string, { sent: number; failed: number; skipped: number; lastSent: number | null }> = {};
    for (const log of logs) {
      if (!stats[log.messageKey]) stats[log.messageKey] = { sent: 0, failed: 0, skipped: 0, lastSent: null };
      const s = stats[log.messageKey];
      if (log.status === "sent") s.sent++;
      else if (log.status === "failed") s.failed++;
      else s.skipped++;
      if (s.lastSent === null) s.lastSent = log._creationTime;
    }
    return stats;
  },
});

// ─── Mutations ───────────────────────────────────────────────────────────────

export const upsertMessage = mutation({
  args: {
    messageKey: v.string(),
    smsBody: v.optional(v.string()),
    emailSubject: v.optional(v.string()),
    emailBody: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    channel: v.optional(v.union(v.literal("email"), v.literal("sms"), v.literal("both"))),
  },
  handler: async (ctx, { messageKey, ...fields }) => {
    const existing = await ctx.db
      .query("reviewsMessages")
      .withIndex("by_message_key", (q) => q.eq("messageKey", messageKey))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      const def = DEFAULT_MESSAGES.find((m) => m.messageKey === messageKey);
      if (!def) throw new Error(`Unknown messageKey: ${messageKey}`);
      await ctx.db.insert("reviewsMessages", { ...def, ...fields });
    }
  },
});

export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("reviewsMessages").take(1);
    if (existing.length > 0) return;
    for (const msg of DEFAULT_MESSAGES) {
      await ctx.db.insert("reviewsMessages", msg);
    }
  },
});

// Auto-trigger R1 from bookings.create (fires 2h after appointment)
export const scheduleRatingRequest = internalMutation({
  args: { bookingId: v.id("bookings"), appointmentTs: v.number() },
  handler: async (ctx, { bookingId, appointmentTs }) => {
    const fireAt = appointmentTs + 2 * 60 * 60 * 1000;
    const r1Id = await ctx.scheduler.runAt(
      fireAt,
      internal.reviewActions.sendReviewsMessage,
      { bookingId, messageKey: "r1" }
    );
    await ctx.db.patch(bookingId, { r1ScheduledId: String(r1Id) });
  },
});

// Manually trigger R2/R3/R4 for a specific booking
export const triggerMessageForBooking = mutation({
  args: { bookingId: v.id("bookings"), messageKey: v.string() },
  handler: async (ctx, { bookingId, messageKey }) => {
    await ctx.scheduler.runAfter(0, internal.reviewActions.sendReviewsMessage, {
      bookingId,
      messageKey,
    });
  },
});

// ─── Internal mutations ───────────────────────────────────────────────────────

export const createLog = internalMutation({
  args: {
    messageKey: v.string(),
    bookingId: v.optional(v.id("bookings")),
    recipientName: v.string(),
    recipientEmail: v.string(),
    recipientPhone: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("sms")),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    errorMessage: v.optional(v.string()),
    isTest: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reviewsLogs", args);
  },
});
