"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Resend } from "resend";

function substitute(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, val]) => text.split(`{{${key}}}`).join(val),
    template
  );
}

function emailHtml(bodyText: string, appName: string): string {
  const paragraphs = bodyText
    .split("\n")
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 14px;color:#374151;font-family:-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;">${line}</p>`
        : `<p style="margin:0 0 8px;">&nbsp;</p>`
    )
    .join("");
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f9fafb;">
<div style="max-width:520px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:#0f172a;padding:20px 28px;">
    <span style="color:#fff;font-family:-apple-system,'Segoe UI',sans-serif;font-size:15px;font-weight:600;">${appName}</span>
  </div>
  <div style="padding:28px;">${paragraphs}</div>
  <div style="padding:16px 28px;border-top:1px solid #e5e7eb;background:#f9fafb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;font-family:-apple-system,sans-serif;">${appName}</p>
  </div>
</div></body></html>`;
}

async function doSendEmail(
  to: string, subject: string, html: string, text: string
): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@resend.dev";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, html, text });
  if (error) return { ok: false, error: (error as { message?: string }).message ?? "Unknown" };
  return { ok: true };
}

export const sendReactivationMessage = internalAction({
  args: {
    contactId: v.id("contacts"),
    messageKey: v.string(),
  },
  handler: async (ctx, { contactId, messageKey }) => {
    const [contact, msg, settings] = await Promise.all([
      ctx.runQuery(internal.nurturing.getContactById, { contactId }),
      ctx.runQuery(internal.reactivation.getMessageByKey, { messageKey }),
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

    if (!msg || !msg.enabled) {
      await ctx.runMutation(internal.reactivation.createLog, {
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
      BUSINESS_NAME: settings?.appName || "c4studio",
      RAFFLE_PRIZE: settings?.rafflePrize || "[RAFFLE_PRIZE]",
      RAFFLE_LINK: settings?.raffleLink || "[RAFFLE_LINK]",
      BOOKING_LINK: settings?.defaultBookingLink || "[BOOKING_LINK]",
    };

    if (msg.channel === "email" || msg.channel === "both") {
      const result = await doSendEmail(
        contact.email,
        substitute(msg.emailSubject, vars),
        emailHtml(substitute(msg.emailBody, vars), vars.BUSINESS_NAME),
        substitute(msg.emailBody, vars)
      );
      await ctx.runMutation(internal.reactivation.createLog, {
        ...logBase,
        channel: "email" as const,
        status: (result.ok ? "sent" : "failed") as "sent" | "failed",
        errorMessage: result.error,
      });
    }

    if (msg.channel === "sms" || msg.channel === "both") {
      await ctx.runMutation(internal.reactivation.createLog, {
        ...logBase,
        channel: "sms" as const,
        status: "skipped" as const,
        errorMessage: contact.phone
          ? "SMS not configured — Twilio integration pending"
          : "No phone number on contact record",
      });
    }
  },
});
