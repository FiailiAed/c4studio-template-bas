"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Resend } from "resend";
import { createHmac } from "crypto";

function substitute(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, val]) => text.split(`{{${key}}}`).join(val),
    template
  );
}

function emailHtml(bodyText: string, appName: string, extraHtml = ""): string {
  const paragraphs = bodyText
    .split("\n")
    .map((line) =>
      line.trim()
        ? `<p style="margin:0 0 14px;color:#374151;font-family:-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;">${line}</p>`
        : `<p style="margin:0 0 8px;">&nbsp;</p>`
    )
    .join("");
  return `<!DOCTYPE html><html><body style="margin:0;padding:32px 24px;background:#f9fafb;">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:#0f172a;padding:20px 28px;">
    <span style="color:#fff;font-family:-apple-system,'Segoe UI',sans-serif;font-size:15px;font-weight:600;">${appName}</span>
  </div>
  <div style="padding:28px;">${paragraphs}${extraHtml}</div>
  <div style="padding:16px 28px;border-top:1px solid #e5e7eb;background:#f9fafb;">
    <p style="margin:0;color:#9ca3af;font-size:12px;font-family:-apple-system,sans-serif;">${appName}</p>
  </div>
</div></body></html>`;
}

function signUnsubToken(contactId: string, secret: string): string {
  return createHmac("sha256", secret).update(`unsub:${contactId}`).digest("hex");
}

function unsubFooterHtml(contactId: string | null): string {
  const siteUrl = process.env.CONVEX_SITE_URL;
  if (!siteUrl || !contactId) return "";
  const secret = process.env.CANCEL_SECRET ?? "dev-secret";
  const token = signUnsubToken(contactId, secret);
  const unsubUrl = `${siteUrl}/api/unsubscribe?contactId=${contactId}&token=${token}`;
  return `<div style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-family:sans-serif;font-size:12px;color:#94a3b8;"><a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> from these emails.</div>`;
}

function responseButtonsHtml(contactId: string, siteUrl: string): string {
  const secret = process.env.CANCEL_SECRET ?? "dev-secret";
  const yesToken = createHmac("sha256", secret).update(`reac:${contactId}:yes`).digest("hex");
  const noToken = createHmac("sha256", secret).update(`reac:${contactId}:no`).digest("hex");
  const base = `${siteUrl}/api/reactivation/respond`;
  return `
<div style="margin:24px 0;">
  <a href="${base}?contactId=${contactId}&token=${yesToken}&r=yes"
     style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-family:-apple-system,sans-serif;font-size:14px;font-weight:600;margin-right:10px;">
    ✓ Yes, I'm in!
  </a>
  <a href="${base}?contactId=${contactId}&token=${noToken}&r=no"
     style="display:inline-block;background:#f1f5f9;color:#64748b;padding:12px 28px;border-radius:8px;text-decoration:none;font-family:-apple-system,sans-serif;font-size:14px;">
    No thanks, remove me
  </a>
</div>`
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

export const testSendReactivation = action({
  args: {
    contactId: v.id("contacts"),
    messageKey: v.string(),
    testEmail: v.string(),
  },
  handler: async (ctx, { contactId, messageKey, testEmail }): Promise<{ ok: boolean; subject: string; error?: string }> => {
    const [contact, msg, settings] = await Promise.all([
      ctx.runQuery(internal.nurturing.getContactById, { contactId }),
      ctx.runQuery(internal.reactivation.getMessageByKey, { messageKey }),
      ctx.runQuery(internal.nurturing.getSettingsInternal, {}),
    ]);

    if (!contact) return { ok: false, subject: "", error: "Contact not found" };
    if (!msg) return { ok: false, subject: "", error: "Message not configured" };

    const firstName = contact.name.split(" ")[0] || contact.name;
    const vars: Record<string, string> = {
      FIRST_NAME: firstName,
      BUSINESS_NAME: settings?.appName || "c4studio",
      RAFFLE_PRIZE: settings?.rafflePrize || "[RAFFLE_PRIZE]",
      RAFFLE_LINK: settings?.raffleLink || "[RAFFLE_LINK]",
      BOOKING_LINK: settings?.defaultBookingLink || "[BOOKING_LINK]",
      REBOOKING_LINK: settings?.defaultBookingLink || "[REBOOKING_LINK]",
    };

    const subject = substitute(msg.emailSubject, vars);
    const logBase = {
      messageKey,
      contactId,
      recipientName: contact.name,
      recipientEmail: testEmail,
      recipientPhone: contact.phone,
      isTest: true as const,
    };

    if (msg.channel === "email" || msg.channel === "both") {
      const result = await doSendEmail(
        testEmail,
        subject,
        emailHtml(substitute(msg.emailBody, vars), vars.BUSINESS_NAME),
        substitute(msg.emailBody, vars)
      );
      await ctx.runMutation(internal.reactivation.createLog, {
        ...logBase,
        channel: "email" as const,
        status: (result.ok ? "sent" : "failed") as "sent" | "failed",
        errorMessage: result.error,
      });
      return { ok: result.ok, subject, error: result.error };
    }

    await ctx.runMutation(internal.reactivation.createLog, {
      ...logBase,
      channel: "sms" as const,
      status: "skipped" as const,
      errorMessage: "SMS not configured — Twilio integration pending",
    });
    return { ok: false, subject, error: "SMS not configured — Twilio integration pending" };
  },
});

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

    // Opt-out check — skip if contact has unsubscribed
    if (contact.optedOut) {
      await ctx.runMutation(internal.reactivation.createLog, {
        ...logBase,
        channel: "email" as const,
        status: "skipped" as const,
        errorMessage: "opted_out",
      });
      return;
    }

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
      // D1/D2/D3 get YES/NO response buttons; handlers do not
      const siteUrl = settings?.siteUrl ?? "";
      const responseButtons =
        ["d1", "d2", "d3"].includes(messageKey) && siteUrl
          ? responseButtonsHtml(contactId, siteUrl)
          : "";
      const footer = unsubFooterHtml(contactId);
      const extraHtml = responseButtons + footer;
      const result = await doSendEmail(
        contact.email,
        substitute(msg.emailSubject, vars),
        emailHtml(substitute(msg.emailBody, vars), vars.BUSINESS_NAME, extraHtml),
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
