import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const getLatestByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) =>
    ctx.db
      .query("bookings")
      .withIndex("by_email", (q) => q.eq("email", email))
      .order("desc")
      .first(),
});

export const listByBookingLink = query({
  args: { bookingLinkId: v.id("bookingLinks") },
  handler: async (ctx, { bookingLinkId }) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_booking_link", (q) => q.eq("bookingLinkId", bookingLinkId))
      .order("desc")
      .take(200);
  },
});

export const listByDate = query({
  args: { bookingLinkId: v.id("bookingLinks"), date: v.string() },
  handler: async (ctx, { bookingLinkId, date }) => {
    return await ctx.db
      .query("bookings")
      .withIndex("by_booking_link_and_date", (q) =>
        q.eq("bookingLinkId", bookingLinkId).eq("date", date)
      )
      .take(200);
  },
});

export const create = mutation({
  args: {
    bookingLinkId: v.id("bookingLinks"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    date: v.string(),
    startTime: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [link, settings] = await Promise.all([
      ctx.db.get(args.bookingLinkId),
      ctx.db.query("appSettings").first(),
    ]);

    const id = await ctx.db.insert("bookings", { ...args, status: "confirmed" });

    // Transactional confirmation email (Resend)
    await ctx.scheduler.runAfter(0, internal.email.sendBookingConfirmation, {
      to: args.email,
      name: args.name,
      linkName: link?.name ?? "Appointment",
      date: args.date,
      startTime: args.startTime,
      duration: link?.duration ?? 60,
      appName: settings?.appName ?? "c4studio",
      supportEmail: settings?.supportEmail ?? "",
    });

    // Lead nurturing sequence — M4a immediate, M4b/4c/5 scheduled around appointment time
    await ctx.scheduler.runAfter(
      0,
      internal.nurturingActions.sendBookingNurturing,
      { bookingId: id, messageKey: "m4a" }
    );

    // Compute appointment timestamp (parsed as local time — treat as UTC in Convex runtime)
    const appointmentTs = new Date(`${args.date}T${args.startTime}:00`).getTime();
    const now = Date.now();

    const m4bTs = appointmentTs - 24 * 60 * 60 * 1000;
    const m4cTs = appointmentTs - 2 * 60 * 60 * 1000;
    const m5Ts = appointmentTs + 60 * 60 * 1000;

    const m4bId = m4bTs > now
      ? await ctx.scheduler.runAt(m4bTs, internal.nurturingActions.sendBookingNurturing, { bookingId: id, messageKey: "m4b" })
      : null;
    const m4cId = m4cTs > now
      ? await ctx.scheduler.runAt(m4cTs, internal.nurturingActions.sendBookingNurturing, { bookingId: id, messageKey: "m4c" })
      : null;
    const m5Id = await ctx.scheduler.runAt(
      m5Ts,
      internal.nurturingActions.sendBookingNurturing,
      { bookingId: id, messageKey: "m5" }
    );

    // Agent 4 (Reviews & Referrals) — R1 fires 2h after appointment
    await ctx.scheduler.runAfter(0, internal.reviews.scheduleRatingRequest, {
      bookingId: id,
      appointmentTs,
    });

    await ctx.db.patch(id, {
      m4bScheduledId: m4bId ? String(m4bId) : undefined,
      m4cScheduledId: m4cId ? String(m4cId) : undefined,
      m5ScheduledId: String(m5Id),
    });

    return id;
  },
});

export const cancel = mutation({
  args: { id: v.id("bookings") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "cancelled" });
  },
});

export const remove = mutation({
  args: { id: v.id("bookings") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
