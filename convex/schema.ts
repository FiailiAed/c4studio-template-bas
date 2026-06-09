import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Synced from Clerk via webhook — source of truth for user profiles
  users: defineTable({
    clerkId: v.string(),
    // Full Convex tokenIdentifier (issuer|subject) — used as userId in Stripe component
    tokenIdentifier: v.optional(v.string()),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_token_identifier", ["tokenIdentifier"]),

  // Blog posts
  posts: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    excerpt: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    authorId: v.id("users"),
    published: v.boolean(),
    publishedAt: v.optional(v.number()),
    tags: v.array(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_author", ["authorId"])
    .index("by_published", ["published"]),

  // Client testimonials / reviews
  testimonials: defineTable({
    authorName: v.string(),
    authorTitle: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    body: v.string(),
    rating: v.number(),
    featured: v.boolean(),
    approved: v.boolean(),
  })
    .index("by_featured", ["featured"])
    .index("by_approved", ["approved"]),

  // Contact form submissions
  contacts: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.optional(v.string()),
    message: v.string(),
    read: v.boolean(),
    // Agent 5 (Lead Nurturing) scheduled IDs
    m2ScheduledId: v.optional(v.string()),
    m3ScheduledId: v.optional(v.string()),
    // Agent 3 (Reactivation) scheduled IDs
    reacD2ScheduledId: v.optional(v.string()),
    reacD3ScheduledId: v.optional(v.string()),
  })
    .index("by_read", ["read"])
    .index("by_email", ["email"]),

  // Gallery media items
  gallery: defineTable({
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    mediaType: v.union(v.literal("image"), v.literal("video"), v.literal("pdf")),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    order: v.number(),
    published: v.boolean(),
  })
    .index("by_order", ["order"])
    .index("by_published", ["published"]),

  pricingTiers: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    currency: v.string(),
    billingPeriod: v.union(
      v.literal("monthly"),
      v.literal("annual"),
      v.literal("one_time"),
      v.literal("custom")
    ),
    priceLabel: v.optional(v.string()),
    features: v.array(v.string()),
    highlighted: v.boolean(),
    ctaLabel: v.string(),
    ctaHref: v.string(),
    published: v.boolean(),
    order: v.number(),
  })
    .index("by_published", ["published"])
    .index("by_order", ["order"]),

  funnels: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    published: v.boolean(),
    // Page content fields
    headline: v.optional(v.string()),
    subheadline: v.optional(v.string()),
    ctaLabel: v.optional(v.string()),
    ctaHref: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"]),

  shops: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    published: v.boolean(),
    headline: v.optional(v.string()),
    subheadline: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"]),

  shopItems: defineTable({
    shopId: v.id("shops"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    currency: v.string(),
    stripePriceId: v.string(),
    imageUrl: v.optional(v.string()),
    published: v.boolean(),
    order: v.number(),
  })
    .index("by_shop", ["shopId"])
    .index("by_shop_and_published", ["shopId", "published"]),

  bookingLinks: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    published: v.boolean(),
    headline: v.optional(v.string()),
    subheadline: v.optional(v.string()),
    duration: v.optional(v.number()),
    bufferTime: v.optional(v.number()),
    availabilityStart: v.optional(v.string()),
    availabilityEnd: v.optional(v.string()),
    availableDays: v.optional(v.array(v.number())),
    timezone: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"]),

  bookings: defineTable({
    bookingLinkId: v.id("bookingLinks"),
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    date: v.string(),
    startTime: v.string(),
    status: v.union(v.literal("confirmed"), v.literal("cancelled")),
    notes: v.optional(v.string()),
    // Agent 5 (Lead Nurturing) scheduled IDs
    m4bScheduledId: v.optional(v.string()),
    m4cScheduledId: v.optional(v.string()),
    m5ScheduledId: v.optional(v.string()),
    // Agent 4 (Reviews & Referrals) scheduled ID
    r1ScheduledId: v.optional(v.string()),
  })
    .index("by_booking_link", ["bookingLinkId"])
    .index("by_booking_link_and_date", ["bookingLinkId", "date"])
    .index("by_email", ["email"]),

  // Per-page status overrides — keyed by route. If no record exists, status defaults to 'planned'.
  sitePages: defineTable({
    route: v.string(),
    status: v.union(v.literal('active'), v.literal('planned'), v.literal('hidden')),
  }).index('by_route', ['route']),

  // Email templates for the Communications module
  emailTemplates: defineTable({
    name: v.string(),
    subject: v.string(),
    htmlBody: v.string(),
  }).index("by_name", ["name"]),

  // Log of all emails sent from the admin portal
  emailLogs: defineTable({
    type: v.union(v.literal("single"), v.literal("broadcast")),
    recipients: v.array(v.string()),
    subject: v.string(),
    templateId: v.optional(v.id("emailTemplates")),
    sentByClerkId: v.string(),
    recipientCount: v.number(),
  }),

  // Singleton app-wide settings document
  appSettings: defineTable({
    // General
    appName: v.optional(v.string()),
    siteUrl: v.optional(v.string()),
    supportEmail: v.optional(v.string()),
    description: v.optional(v.string()),
    // Feature flags
    maintenanceMode: v.optional(v.boolean()),
    registrationEnabled: v.optional(v.boolean()),
    blogEnabled: v.optional(v.boolean()),
    // Notifications
    adminAlertEmail: v.optional(v.string()),
    notifyOnContact: v.optional(v.boolean()),
    notifyOnNewUser: v.optional(v.boolean()),
    // Design system brand colors
    primaryColor: v.optional(v.string()),
    primaryName: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    secondaryName: v.optional(v.string()),
    tertiaryColor: v.optional(v.string()),
    tertiaryName: v.optional(v.string()),
    neutralColor: v.optional(v.string()),
    neutralName: v.optional(v.string()),
    // External review link — e.g. Google review form URL
    googleReviewUrl: v.optional(v.string()),
    // Lead nurturing / SMS infrastructure
    primaryService: v.optional(v.string()),
    defaultBookingLink: v.optional(v.string()),
    // Reactivation campaign (Agent 3)
    rafflePrize: v.optional(v.string()),
    raffleLink: v.optional(v.string()),
    // Reviews & Referrals (Agent 4)
    feedbackFormLink: v.optional(v.string()),
    referralShareLink: v.optional(v.string()),
    referralIntroOffer: v.optional(v.string()),
  }),

  // Lead nurturing message templates (Agent 5)
  nurturingMessages: defineTable({
    messageKey: v.string(),
    label: v.string(),
    triggerDescription: v.string(),
    smsBody: v.string(),
    emailSubject: v.string(),
    emailBody: v.string(),
    enabled: v.boolean(),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("both")),
    order: v.number(),
  }).index("by_message_key", ["messageKey"]),

  // Agent 3 — Reactivation campaign templates
  reactivationMessages: defineTable({
    messageKey: v.string(),
    label: v.string(),
    triggerDescription: v.string(),
    smsBody: v.string(),
    emailSubject: v.string(),
    emailBody: v.string(),
    enabled: v.boolean(),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("both")),
    order: v.number(),
  }).index("by_message_key", ["messageKey"]),

  // Agent 3 — Reactivation send attempts log
  reactivationLogs: defineTable({
    messageKey: v.string(),
    contactId: v.optional(v.id("contacts")),
    recipientName: v.string(),
    recipientEmail: v.string(),
    recipientPhone: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("sms")),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    errorMessage: v.optional(v.string()),
  })
    .index("by_message_key", ["messageKey"])
    .index("by_contact_id", ["contactId"]),

  // Agent 4 — Reviews & Referrals message templates
  reviewsMessages: defineTable({
    messageKey: v.string(),
    label: v.string(),
    triggerDescription: v.string(),
    smsBody: v.string(),
    emailSubject: v.string(),
    emailBody: v.string(),
    enabled: v.boolean(),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("both")),
    // "automated" = fires via scheduler; "template" = copy-paste only (R5 Google review replies)
    messageType: v.union(v.literal("automated"), v.literal("template")),
    order: v.number(),
  }).index("by_message_key", ["messageKey"]),

  // Agent 4 — Reviews & Referrals send attempts log
  reviewsLogs: defineTable({
    messageKey: v.string(),
    bookingId: v.optional(v.id("bookings")),
    recipientName: v.string(),
    recipientEmail: v.string(),
    recipientPhone: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("sms")),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    errorMessage: v.optional(v.string()),
  })
    .index("by_message_key", ["messageKey"])
    .index("by_booking_id", ["bookingId"]),

  // Log of all nurturing message send attempts
  nurturingLogs: defineTable({
    messageKey: v.string(),
    contactId: v.optional(v.id("contacts")),
    bookingId: v.optional(v.id("bookings")),
    recipientName: v.string(),
    recipientEmail: v.string(),
    recipientPhone: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("sms")),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    errorMessage: v.optional(v.string()),
  })
    .index("by_message_key", ["messageKey"])
    .index("by_contact_id", ["contactId"]),
});
