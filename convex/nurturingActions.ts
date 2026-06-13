"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Resend } from "resend";
import crypto from "node:crypto";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function substitute(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, val]) => text.split(`{{${key}}}`).join(val),
    template
  );
}

function signUnsubToken(contactId: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`unsub:${contactId}`).digest("hex");
}

function unsubFooterHtml(contactId: string | null): string {
  const siteUrl = process.env.CONVEX_SITE_URL;
  if (!siteUrl || !contactId) return "";
  const secret = process.env.CANCEL_SECRET ?? "dev-secret";
  const token = signUnsubToken(contactId, secret);
  const unsubUrl = `${siteUrl}/api/unsubscribe?contactId=${contactId}&token=${token}`;
  return `<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-family:sans-serif;font-size:12px;color:#94a3b8;"><a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> from these emails.</div>`;
}

function emailHtml(bodyText: string, appName: string, extraHtml = ""): string {
  const paragraphs = bodyText
    .split("\n")
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 14px;color:#374151;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;">${line}</p>`
        : `<p style="margin:0 0 8px;">&nbsp;</p>`
    )
    .join("");

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f9fafb;">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:#0f172a;padding:20px 28px;">
    <span style="color:#fff;font-family:-apple-system,'Segoe UI',sans-serif;font-size:15px;font-weight:600;">${appName}</span>
  </div>
  <div style="padding:28px;">${paragraphs}${extraHtml}</div>
  <div style="padding:16px 28px;border-top:1px solid #e5e7eb;background:#f9fafb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;font-family:-apple-system,sans-serif;">${appName}</p>
  </div>
</div></body></html>`;
}

function fmt12h(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function fmtDate(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

async function doSendEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@resend.dev";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) return { ok: false, error: (error as { message?: string }).message ?? "Unknown" };
  return { ok: true };
}

// ─── Test sends (admin debugger) ────────────────────────────────────────────

export const testSendNurturing = action({
  args: {
    messageKey: v.string(),
    testEmail: v.string(),
    contactId: v.optional(v.id("contacts")),
    bookingId: v.optional(v.id("bookings")),
  },
  handler: async (ctx, { messageKey, testEmail, contactId, bookingId }): Promise<{ ok: boolean; subject: string; error?: string }> => {
    const contactMessages = ["m1", "m2", "m3"];
    const isContactMsg = contactMessages.includes(messageKey);

    const [msg, settings] = await Promise.all([
      ctx.runQuery(internal.nurturing.getMessageByKey, { messageKey }),
      ctx.runQuery(internal.nurturing.getSettingsInternal, {}),
    ]);

    if (!msg) return { ok: false, subject: "", error: "Message not configured" };

    let recipientName = "Test Contact";
    let recipientPhone: string | undefined;
    let vars: Record<string, string>;

    if (isContactMsg && contactId) {
      const contact = await ctx.runQuery(internal.nurturing.getContactById, { contactId });
      if (!contact) return { ok: false, subject: "", error: "Contact not found" };
      const firstName = contact.name.split(" ")[0] || contact.name;
      recipientName = contact.name;
      recipientPhone = contact.phone;
      vars = {
        FIRST_NAME: firstName,
        SERVICE: contact.subject || settings?.primaryService || "your inquiry",
        BOOKING_LINK: settings?.defaultBookingLink || "[BOOKING_LINK]",
        REBOOKING_LINK: settings?.defaultBookingLink || "[REBOOKING_LINK]",
        BUSINESS_NAME: settings?.appName || "c4studio",
      };
    } else if (!isContactMsg && bookingId) {
      const booking = await ctx.runQuery(internal.nurturing.getBookingById, { bookingId });
      if (!booking) return { ok: false, subject: "", error: "Booking not found" };
      const link = await ctx.runQuery(internal.nurturing.getBookingLinkById, { bookingLinkId: booking.bookingLinkId });
      const firstName = booking.name.split(" ")[0] || booking.name;
      recipientName = booking.name;
      recipientPhone = booking.phone;
      const bookingUrl = settings?.defaultBookingLink || "[BOOKING_LINK]";
      vars = {
        FIRST_NAME: firstName,
        SERVICE: link?.name || "your appointment",
        BUSINESS_NAME: settings?.appName || "c4studio",
        APPOINTMENT_DATE: fmtDate(booking.date),
        APPOINTMENT_TIME: fmt12h(booking.startTime),
        BOOKING_LINK: bookingUrl,
        REBOOKING_LINK: bookingUrl,
      };
    } else {
      return { ok: false, subject: "", error: isContactMsg ? "Contact ID required for this message" : "Booking ID required for this message" };
    }

    const subject = substitute(msg.emailSubject, vars);
    const logBase = {
      messageKey,
      contactId: isContactMsg ? contactId : undefined,
      bookingId: !isContactMsg ? bookingId : undefined,
      recipientName,
      recipientEmail: testEmail,
      recipientPhone,
      isTest: true as const,
    };

    if (msg.channel === "email" || msg.channel === "both") {
      const result = await doSendEmail(
        testEmail,
        subject,
        emailHtml(substitute(msg.emailBody, vars), vars.BUSINESS_NAME),
        substitute(msg.emailBody, vars)
      );
      await ctx.runMutation(internal.nurturing.createLog, {
        ...logBase,
        channel: "email" as const,
        status: (result.ok ? "sent" : "failed") as "sent" | "failed",
        errorMessage: result.error,
      });
      return { ok: result.ok, subject, error: result.error };
    }

    await ctx.runMutation(internal.nurturing.createLog, {
      ...logBase,
      channel: "sms" as const,
      status: "skipped" as const,
      errorMessage: "SMS not configured — Twilio integration pending",
    });
    return { ok: false, subject, error: "SMS not configured — Twilio integration pending" };
  },
});

// ─── Contact nurturing (M1, M2, M3) ─────────────────────────────────────────

export const sendContactNurturing = internalAction({
  args: {
    contactId: v.id("contacts"),
    messageKey: v.string(),
  },
  handler: async (ctx, { contactId, messageKey }) => {
    const [contact, msg, settings] = await Promise.all([
      ctx.runQuery(internal.nurturing.getContactById, { contactId }),
      ctx.runQuery(internal.nurturing.getMessageByKey, { messageKey }),
      ctx.runQuery(internal.nurturing.getSettingsInternal, {}),
    ]);

    if (!contact) return;

    const logBase = {
      messageKey,
      contactId,
      recipientName: contact.name,
      recipientEmail: contact.email,
      recipientPhone: contact.phone,
    };

    // Opt-out check — skip if contact has unsubscribed
    if (contact.optedOut) {
      await ctx.runMutation(internal.nurturing.createLog, {
        ...logBase,
        channel: "email" as const,
        status: "skipped" as const,
        errorMessage: "opted_out",
      });
      return;
    }

    if (!msg || !msg.enabled) {
      await ctx.runMutation(internal.nurturing.createLog, {
        ...logBase,
        channel: "email" as const,
        status: "skipped" as const,
        errorMessage: !msg ? "Message not configured" : "Message disabled",
      });
      return;
    }

    const firstName = contact.name.split(" ")[0] || contact.name;
    const vars: Record<string, string> = {
      FIRST_NAME: firstName,
      SERVICE: contact.subject || settings?.primaryService || "your inquiry",
      BOOKING_LINK: settings?.defaultBookingLink || "[BOOKING_LINK]",
      BUSINESS_NAME: settings?.appName || "c4studio",
    };

    if (msg.channel === "email" || msg.channel === "both") {
      const footer = unsubFooterHtml(contactId);
      const result = await doSendEmail(
        contact.email,
        substitute(msg.emailSubject, vars),
        emailHtml(substitute(msg.emailBody, vars), vars.BUSINESS_NAME, footer),
        substitute(msg.emailBody, vars)
      );
      await ctx.runMutation(internal.nurturing.createLog, {
        ...logBase,
        channel: "email" as const,
        status: (result.ok ? "sent" : "failed") as "sent" | "failed",
        errorMessage: result.error,
      });
    }

    if (msg.channel === "sms" || msg.channel === "both") {
      const hasPhone = Boolean(contact.phone);
      await ctx.runMutation(internal.nurturing.createLog, {
        ...logBase,
        channel: "sms" as const,
        status: "skipped" as const,
        errorMessage: hasPhone
          ? "SMS not configured — Twilio integration pending"
          : "No phone number on contact record",
      });
    }
  },
});

// ─── Booking nurturing (M4a, M4b, M4c, M5) ──────────────────────────────────

export const sendBookingNurturing = internalAction({
  args: {
    bookingId: v.id("bookings"),
    messageKey: v.string(),
  },
  handler: async (ctx, { bookingId, messageKey }) => {
    const [booking, msg, settings] = await Promise.all([
      ctx.runQuery(internal.nurturing.getBookingById, { bookingId }),
      ctx.runQuery(internal.nurturing.getMessageByKey, { messageKey }),
      ctx.runQuery(internal.nurturing.getSettingsInternal, {}),
    ]);

    if (!booking) return;

    const logBase = {
      messageKey,
      bookingId,
      recipientName: booking.name,
      recipientEmail: booking.email,
      recipientPhone: booking.phone,
    };

    // Look up contact record by email for opt-out check and unsubscribe link
    const contactByEmail = await ctx.runQuery(internal.nurturing.getContactByEmail, {
      email: booking.email,
    });

    // Opt-out check — skip if matching contact has unsubscribed
    if (contactByEmail?.optedOut) {
      await ctx.runMutation(internal.nurturing.createLog, {
        ...logBase,
        channel: "email" as const,
        status: "skipped" as const,
        errorMessage: "opted_out",
      });
      return;
    }

    // M5 no-show: skip if booking was cancelled
    if (messageKey === "m5" && booking.status === "cancelled") {
      await ctx.runMutation(internal.nurturing.createLog, {
        ...logBase,
        channel: "email" as const,
        status: "skipped" as const,
        errorMessage: "Booking cancelled — not a no-show",
      });
      return;
    }

    if (!msg || !msg.enabled) {
      await ctx.runMutation(internal.nurturing.createLog, {
        ...logBase,
        channel: "email" as const,
        status: "skipped" as const,
        errorMessage: !msg ? "Message not configured" : "Message disabled",
      });
      return;
    }

    const link = await ctx.runQuery(internal.nurturing.getBookingLinkById, {
      bookingLinkId: booking.bookingLinkId,
    });

    const firstName = booking.name.split(" ")[0] || booking.name;
    const bookingUrl = settings?.defaultBookingLink || "[BOOKING_LINK]";
    const vars: Record<string, string> = {
      FIRST_NAME: firstName,
      SERVICE: link?.name || "your appointment",
      BUSINESS_NAME: settings?.appName || "c4studio",
      APPOINTMENT_DATE: fmtDate(booking.date),
      APPOINTMENT_TIME: fmt12h(booking.startTime),
      BOOKING_LINK: bookingUrl,
      REBOOKING_LINK: bookingUrl,
    };

    if (msg.channel === "email" || msg.channel === "both") {
      const footer = unsubFooterHtml(contactByEmail?._id ?? null);
      const result = await doSendEmail(
        booking.email,
        substitute(msg.emailSubject, vars),
        emailHtml(substitute(msg.emailBody, vars), vars.BUSINESS_NAME, footer),
        substitute(msg.emailBody, vars)
      );
      await ctx.runMutation(internal.nurturing.createLog, {
        ...logBase,
        channel: "email" as const,
        status: (result.ok ? "sent" : "failed") as "sent" | "failed",
        errorMessage: result.error,
      });
    }

    if (msg.channel === "sms" || msg.channel === "both") {
      const hasPhone = Boolean(booking.phone);
      await ctx.runMutation(internal.nurturing.createLog, {
        ...logBase,
        channel: "sms" as const,
        status: "skipped" as const,
        errorMessage: hasPhone
          ? "SMS not configured — Twilio integration pending"
          : "No phone number on booking record",
      });
    }
  },
});
