import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ─── Default message templates (from .devnotes/drc-reactivation.md) ──────────

const DEFAULT_MESSAGES = [
  {
    messageKey: "d1",
    label: "Day 1 — Initial Message",
    triggerDescription: "Fires immediately when campaign is triggered for a contact",
    smsBody: "{{BUSINESS_NAME}} here. It's been a while — giving away {{RAFFLE_PRIZE}} this month for reconnecting. Want your name in? Reply YES",
    emailSubject: "There's a prize with your name on it",
    emailBody: "{{FIRST_NAME}},\n\nIt's been a while since we last connected, and I've been meaning to reach out.\n\nWe're giving away {{RAFFLE_PRIZE}} this month — one winner, no catch, no cost. Getting an entry takes about ten seconds.\n\n→ Enter the raffle: {{RAFFLE_LINK}}\n\n(Or just reply YES and I'll get you in.)\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 1,
  },
  {
    messageKey: "d2",
    label: "Day 2 — Follow-Up (Non-Responders)",
    triggerDescription: "Fires 24 hours after Day 1 if no response",
    smsBody: "{{BUSINESS_NAME}} again. Didn't hear back — we're drawing {{RAFFLE_PRIZE}} soon. Takes 2 sec. Reply YES",
    emailSubject: "Quick nudge — we're drawing soon",
    emailBody: "{{FIRST_NAME}},\n\nI didn't hear back, so my first message probably got buried — happens to everyone.\n\nShort version: one person wins {{RAFFLE_PRIZE}} and the drawing is coming up fast.\n\nWant me to drop your name in?\n\n→ Enter the raffle: {{RAFFLE_LINK}} — or reply YES.\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 2,
  },
  {
    messageKey: "d3",
    label: "Day 3 — Final Nudge (Deadline)",
    triggerDescription: "Fires 48 hours after Day 1 — last message",
    smsBody: "Last call from {{BUSINESS_NAME}} — raffle for {{RAFFLE_PRIZE}} closes tonight. Reply YES",
    emailSubject: "Last call — closes tonight",
    emailBody: "{{FIRST_NAME}},\n\nOne last time.\n\nThe raffle for {{RAFFLE_PRIZE}} closes tonight. After that I'm pulling names and picking a winner — and I won't bug you about this again.\n\nIf you want in, this is the moment.\n\n→ Claim your entry: {{RAFFLE_LINK}} — or reply YES.\n\nEither way, hope to reconnect soon.\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 3,
  },
  {
    messageKey: "yes_handler",
    label: "YES Response Handler",
    triggerDescription: "Fires when contact replies YES — requires Twilio inbound SMS webhook",
    smsBody: "You're entered for {{RAFFLE_PRIZE}}! Lock in a time here so you're ready either way → {{BOOKING_LINK}}. See you soon. — {{BUSINESS_NAME}}",
    emailSubject: "You're in!",
    emailBody: "{{FIRST_NAME}},\n\nYou're entered for {{RAFFLE_PRIZE}}!\n\nWhile you're here — lock in a time to reconnect:\n\n{{BOOKING_LINK}}\n\nSee you soon.\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 4,
  },
  {
    messageKey: "no_handler",
    label: "NO / STOP Response Handler",
    triggerDescription: "Fires when contact replies NO or STOP — requires Twilio inbound SMS webhook",
    smsBody: "No problem at all — you're off this list. If you ever want to reconnect, you know where to find us. Take care. — {{BUSINESS_NAME}}",
    emailSubject: "No problem",
    emailBody: "{{FIRST_NAME}},\n\nNo problem at all — you've been removed from this list and won't hear from us about the raffle again.\n\nIf you ever want to reconnect, we'd love to have you back.\n\nTake care.\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 5,
  },
] as const;

// ─── Internal query helpers (called by reactivationActions via ctx.runQuery) ──

export const getMessageByKey = internalQuery({
  args: { messageKey: v.string() },
  handler: async (ctx, { messageKey }) =>
    ctx.db
      .query("reactivationMessages")
      .withIndex("by_message_key", (q) => q.eq("messageKey", messageKey))
      .unique(),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

export const listMessages = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("reactivationMessages").order("asc").take(20),
});

export const listLogs = query({
  args: {
    messageKey: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { messageKey, limit }) => {
    if (messageKey) {
      return ctx.db
        .query("reactivationLogs")
        .withIndex("by_message_key", (q) => q.eq("messageKey", messageKey))
        .order("desc")
        .take(limit ?? 50);
    }
    return ctx.db.query("reactivationLogs").order("desc").take(limit ?? 100);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("reactivationLogs").order("desc").take(2000);
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
      .query("reactivationMessages")
      .withIndex("by_message_key", (q) => q.eq("messageKey", messageKey))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      const def = DEFAULT_MESSAGES.find((m) => m.messageKey === messageKey);
      if (!def) throw new Error(`Unknown messageKey: ${messageKey}`);
      await ctx.db.insert("reactivationMessages", { ...def, ...fields });
    }
  },
});

export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("reactivationMessages").take(1);
    if (existing.length > 0) return;
    for (const msg of DEFAULT_MESSAGES) {
      await ctx.db.insert("reactivationMessages", msg);
    }
  },
});

// Manually trigger the 3-day reactivation campaign for a contact
export const triggerCampaign = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, { contactId }) => {
    await ctx.scheduler.runAfter(0, internal.reactivationActions.sendReactivationMessage, {
      contactId,
      messageKey: "d1",
    });
    const d2Id = await ctx.scheduler.runAfter(
      24 * 60 * 60 * 1000,
      internal.reactivationActions.sendReactivationMessage,
      { contactId, messageKey: "d2" }
    );
    const d3Id = await ctx.scheduler.runAfter(
      48 * 60 * 60 * 1000,
      internal.reactivationActions.sendReactivationMessage,
      { contactId, messageKey: "d3" }
    );
    await ctx.db.patch(contactId, {
      reacD2ScheduledId: String(d2Id),
      reacD3ScheduledId: String(d3Id),
    });
  },
});

// Manually trigger a single message for a contact (YES/NO handlers)
export const triggerMessageForContact = mutation({
  args: { contactId: v.id("contacts"), messageKey: v.string() },
  handler: async (ctx, { contactId, messageKey }) => {
    await ctx.scheduler.runAfter(0, internal.reactivationActions.sendReactivationMessage, {
      contactId,
      messageKey,
    });
  },
});

// ─── Internal mutations ───────────────────────────────────────────────────────

export const createLog = internalMutation({
  args: {
    messageKey: v.string(),
    contactId: v.optional(v.id("contacts")),
    recipientName: v.string(),
    recipientEmail: v.string(),
    recipientPhone: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("sms")),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("reactivationLogs", args);
  },
});
