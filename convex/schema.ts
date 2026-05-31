import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Synced from Clerk via webhook — source of truth for user profiles
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

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
    subject: v.optional(v.string()),
    message: v.string(),
    read: v.boolean(),
  }).index("by_read", ["read"]),

  // Gallery media items
  gallery: defineTable({
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    storageId: v.id("_storage"),
    mediaType: v.union(v.literal("image"), v.literal("video")),
    order: v.number(),
    published: v.boolean(),
  })
    .index("by_order", ["order"])
    .index("by_published", ["published"]),
});
