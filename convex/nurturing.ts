import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── Default message templates (from .devnotes/drc-lead-nurturing.md) ──────────

const DEFAULT_MESSAGES = [
  {
    messageKey: "m1",
    label: "5-Minute Instant Response",
    triggerDescription: "Fires 5 minutes after contact form submission",
    smsBody: "Hey {{FIRST_NAME}}! Got your message about {{SERVICE}}. I'd love to connect — grab a time here: {{BOOKING_LINK}}",
    emailSubject: "Hey {{FIRST_NAME}} — got your message",
    emailBody: "Hey {{FIRST_NAME}},\n\nGot your message about {{SERVICE}} and wanted to reach out right away.\n\nYou can grab a time here: {{BOOKING_LINK}}\n\nTalk soon,\n{{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 1,
  },
  {
    messageKey: "m2",
    label: "24-Hour Follow-Up",
    triggerDescription: "Fires 24 hours after M1 if lead has not booked",
    smsBody: "{{FIRST_NAME}} — still thinking about {{SERVICE}}? I have a few spots open this week. My calendar: {{BOOKING_LINK}}",
    emailSubject: "Still thinking about {{SERVICE}}?",
    emailBody: "Hey {{FIRST_NAME}},\n\nJust following up on your {{SERVICE}} inquiry. I have a few spots open this week.\n\n{{BOOKING_LINK}}\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 2,
  },
  {
    messageKey: "m3",
    label: "48-Hour Nudge",
    triggerDescription: "Fires 48 hours after M1 if lead has not booked",
    smsBody: "{{FIRST_NAME}}, I've got one spot left for {{SERVICE}} this week. After that I'm booked out. Grab it: {{BOOKING_LINK}}",
    emailSubject: "Last spot for {{SERVICE}} this week",
    emailBody: "Hey {{FIRST_NAME}},\n\nI've got one spot left for {{SERVICE}} this week. After that I'm fully booked out.\n\nGrab it here: {{BOOKING_LINK}}\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 3,
  },
  {
    messageKey: "m4a",
    label: "Booking Confirmation",
    triggerDescription: "Fires immediately when a booking is confirmed",
    smsBody: "You're on the calendar, {{FIRST_NAME}}! {{SERVICE}} — {{APPOINTMENT_DATE}} at {{APPOINTMENT_TIME}}. Reply anytime if something comes up.",
    emailSubject: "You're booked, {{FIRST_NAME}}!",
    emailBody: "Hey {{FIRST_NAME}},\n\nYou're on the calendar!\n\n{{SERVICE}} — {{APPOINTMENT_DATE}} at {{APPOINTMENT_TIME}}\n\nReply to this email if anything comes up.\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 4,
  },
  {
    messageKey: "m4b",
    label: "24-Hour Reminder",
    triggerDescription: "Fires 24 hours before the scheduled appointment",
    smsBody: "Hey {{FIRST_NAME}}, quick heads-up — your {{SERVICE}} appointment is tomorrow at {{APPOINTMENT_TIME}}. See you then!",
    emailSubject: "Reminder: {{SERVICE}} appointment tomorrow",
    emailBody: "Hey {{FIRST_NAME}},\n\nJust a quick reminder — your {{SERVICE}} appointment is tomorrow at {{APPOINTMENT_TIME}}.\n\nSee you then!\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 5,
  },
  {
    messageKey: "m4c",
    label: "2-Hour Reminder",
    triggerDescription: "Fires 2 hours before the scheduled appointment",
    smsBody: "{{FIRST_NAME}}, see you in 2 hours for {{SERVICE}} at {{APPOINTMENT_TIME}}! Reply if you need anything. — {{BUSINESS_NAME}}",
    emailSubject: "See you in 2 hours, {{FIRST_NAME}}!",
    emailBody: "Hey {{FIRST_NAME}},\n\nSee you in 2 hours for {{SERVICE}} at {{APPOINTMENT_TIME}}!\n\nReply if you need anything.\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 6,
  },
  {
    messageKey: "m5",
    label: "No-Show Win-Back",
    triggerDescription: "Fires 60 minutes after a missed appointment",
    smsBody: "Hey {{FIRST_NAME}}, missed you today — no worries at all, life gets busy. Want to find another time? {{REBOOKING_LINK}}",
    emailSubject: "We missed you today, {{FIRST_NAME}}",
    emailBody: "Hey {{FIRST_NAME}},\n\nWe missed you today — no worries at all, life gets busy.\n\nWant to find another time?\n\n{{REBOOKING_LINK}}\n\n— {{BUSINESS_NAME}}",
    enabled: true,
    channel: "email" as const,
    order: 7,
  },
] as const;

// ─── Internal query helpers (called by nurturingActions via ctx.runQuery) ────

import { internalQuery } from "./_generated/server";

export const getContactById = internalQuery({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, { contactId }) => ctx.db.get(contactId),
});

export const getBookingById = internalQuery({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, { bookingId }) => ctx.db.get(bookingId),
});

export const getBookingLinkById = internalQuery({
  args: { bookingLinkId: v.id("bookingLinks") },
  handler: async (ctx, { bookingLinkId }) => ctx.db.get(bookingLinkId),
});

export const getMessageByKey = internalQuery({
  args: { messageKey: v.string() },
  handler: async (ctx, { messageKey }) =>
    ctx.db
      .query("nurturingMessages")
      .withIndex("by_message_key", (q) => q.eq("messageKey", messageKey))
      .unique(),
});

export const getSettingsInternal = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("appSettings").first(),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

export const listMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("nurturingMessages")
      .order("asc")
      .take(20);
  },
});

export const listLogs = query({
  args: {
    messageKey: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { messageKey, limit }) => {
    if (messageKey) {
      return await ctx.db
        .query("nurturingLogs")
        .withIndex("by_message_key", (q) => q.eq("messageKey", messageKey))
        .order("desc")
        .take(limit ?? 50);
    }
    return await ctx.db.query("nurturingLogs").order("desc").take(limit ?? 100);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("nurturingLogs").order("desc").take(2000);
    const stats: Record<string, { sent: number; failed: number; skipped: number; lastSent: number | null }> = {};

    for (const log of logs) {
      if (!stats[log.messageKey]) {
        stats[log.messageKey] = { sent: 0, failed: 0, skipped: 0, lastSent: null };
      }
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
    label: v.optional(v.string()),
    triggerDescription: v.optional(v.string()),
    smsBody: v.optional(v.string()),
    emailSubject: v.optional(v.string()),
    emailBody: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
    channel: v.optional(v.union(v.literal("email"), v.literal("sms"), v.literal("both"))),
  },
  handler: async (ctx, { messageKey, ...fields }) => {
    const existing = await ctx.db
      .query("nurturingMessages")
      .withIndex("by_message_key", (q) => q.eq("messageKey", messageKey))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      const def = DEFAULT_MESSAGES.find((m) => m.messageKey === messageKey);
      if (!def) throw new Error(`Unknown messageKey: ${messageKey}`);
      await ctx.db.insert("nurturingMessages", { ...def, ...fields });
    }
  },
});

export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("nurturingMessages").take(1);
    if (existing.length > 0) return;
    for (const msg of DEFAULT_MESSAGES) {
      await ctx.db.insert("nurturingMessages", msg);
    }
  },
});

// ─── Internal mutations ───────────────────────────────────────────────────────

export const createLog = internalMutation({
  args: {
    messageKey: v.string(),
    contactId: v.optional(v.id("contacts")),
    bookingId: v.optional(v.id("bookings")),
    recipientName: v.string(),
    recipientEmail: v.string(),
    recipientPhone: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("sms")),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("nurturingLogs", args);
  },
});
