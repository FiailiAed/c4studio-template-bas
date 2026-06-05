# Direct-Response Lead Nurturing — SMS Sequence

All messages are SMS-first (≤160 characters with real values substituted).  
Variables use `{{DOUBLE_CURLY}}` notation. See the variable reference below.

---

## Variable Reference

| Variable | Source | Example |
|---|---|---|
| `{{FIRST_NAME}}` | Contact form `name` field — first word only | `Sarah` |
| `{{SERVICE}}` | Contact form `subject` field, or `appSettings.primaryService` as fallback | `free HVAC estimate` |
| `{{BUSINESS_NAME}}` | `appSettings.appName` | `Peak Comfort HVAC` |
| `{{BOOKING_LINK}}` | `appSettings.defaultBookingLink` (selected from `bookingLinks` table) | `https://cal.link/peak` |
| `{{REBOOKING_LINK}}` | Same as `{{BOOKING_LINK}}` unless a separate reschedule link is configured | `https://cal.link/peak` |
| `{{APPOINTMENT_DATE}}` | From booking confirmation webhook payload | `Thursday, Mar 20` |
| `{{APPOINTMENT_TIME}}` | From booking confirmation webhook payload | `2:00 PM` |

---

## Message 1 — THE 5-MINUTE INSTANT RESPONSE

**Trigger:** Fires within 5 minutes of contact form submission.  
**Audience:** All new contact submissions.

```
Hey {{FIRST_NAME}}! Got your message about {{SERVICE}}. I'd love to connect — grab a time here: {{BOOKING_LINK}}
```

---

## Message 2 — THE 24-HOUR FOLLOW-UP

**Trigger:** 24 hours after Message 1, only if lead has not booked.  
**Audience:** Unbooked leads.

```
{{FIRST_NAME}} — still thinking about {{SERVICE}}? I have a few spots open this week. My calendar: {{BOOKING_LINK}}
```

---

## Message 3 — THE 48-HOUR NUDGE

**Trigger:** 48 hours after Message 1 (24 hours after Message 2), only if lead has not booked.  
**Audience:** Unbooked leads.

```
{{FIRST_NAME}}, I've got one spot left for {{SERVICE}} this week. After that I'm booked out. Grab it: {{BOOKING_LINK}}
```

---

## Message 4 — THE BOOKING CONFIRMATION SEQUENCE

### 4a — Immediate Booking Confirmation

**Trigger:** Fires immediately when a booking is confirmed.  
**Audience:** Leads who booked.

```
You're on the calendar, {{FIRST_NAME}}! {{SERVICE}} — {{APPOINTMENT_DATE}} at {{APPOINTMENT_TIME}}. Reply anytime if something comes up.
```

---

### 4b — 24-Hour-Before Reminder

**Trigger:** 24 hours before the scheduled appointment time.  
**Audience:** Booked leads with an upcoming appointment.

```
Hey {{FIRST_NAME}}, quick heads-up — your {{SERVICE}} appointment is tomorrow at {{APPOINTMENT_TIME}}. See you then!
```

---

### 4c — 2-Hour-Before Reminder

**Trigger:** 2 hours before the scheduled appointment time.  
**Audience:** Booked leads with an upcoming appointment.

```
{{FIRST_NAME}}, see you in 2 hours for {{SERVICE}} at {{APPOINTMENT_TIME}}! Reply if you need anything. — {{BUSINESS_NAME}}
```

---

## Message 5 — THE NO-SHOW WIN-BACK

**Trigger:** Fires 30–60 minutes after a missed/no-show appointment.  
**Audience:** Leads who had a confirmed booking but did not show.

```
Hey {{FIRST_NAME}}, missed you today — no worries at all, life gets busy. Want to find another time? {{REBOOKING_LINK}}
```

---

## Implementation Notes

- Messages 1–3 are **outbound SMS** to the lead's phone number (requires phone field on contact form — not currently collected).
- Messages 4a–4c and Message 5 require a **booking webhook** to fire (e.g. from Cal.com, Calendly, or the native `bookingLinks` feature once public-facing pages are built).
- The 48-hour sequence (Messages 1–3) should be cancelled automatically if the lead books at any point.
- All messages should be logged to a `smsLogs` Convex table mirroring the existing `emailLogs` pattern.
