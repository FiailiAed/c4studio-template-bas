import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db.query("posts").order("desc").take(100);
    return await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, authorName: author?.name ?? author?.email ?? "Unknown" };
      })
    );
  },
});

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_published", (q) => q.eq("published", true))
      .order("desc")
      .take(100);
    return await Promise.all(
      posts.map(async (post) => {
        const author = await ctx.db.get(post.authorId);
        return { ...post, authorName: author?.name ?? author?.email ?? "Unknown" };
      })
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const post = await ctx.db
      .query("posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!post) return null;
    const author = await ctx.db.get(post.authorId);
    return { ...post, authorName: author?.name ?? author?.email ?? "Unknown" };
  },
});

export const get = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    excerpt: v.optional(v.string()),
    authorId: v.id("users"),
    published: v.boolean(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const publishedAt = args.published ? Date.now() : undefined;
    return await ctx.db.insert("posts", { ...args, publishedAt });
  },
});

export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.string(),
    slug: v.string(),
    body: v.string(),
    excerpt: v.optional(v.string()),
    published: v.boolean(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Post not found.");
    // Set publishedAt only when first publishing; preserve it if toggling off
    const publishedAt = (!existing.published && fields.published)
      ? Date.now()
      : existing.publishedAt;
    await ctx.db.patch(id, { ...fields, publishedAt });
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
