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
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"]),

  shops: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    published: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"]),

  bookingLinks: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    published: v.boolean(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["published"]),

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
  }),
});
