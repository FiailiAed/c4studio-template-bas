import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Generate entry URL (call from server-side agent action files):
// const token = await signToken(`raffle:${raffleId}:${contactId}`);
// const url = `${siteUrl}/api/raffle/enter?raffleId=${raffleId}&contactId=${contactId}&token=${token}`;

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("raffles").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("raffles") },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const getEntries = query({
  args: { raffleId: v.id("raffles") },
  handler: async (ctx, { raffleId }) => {
    return await ctx.db
      .query("raffleEntries")
      .withIndex("by_raffle", (q) => q.eq("raffleId", raffleId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    prize: v.string(),
    drawDate: v.optional(v.string()),
    description: v.optional(v.string()),
    campaignType: v.union(
      v.literal("reactivation"),
      v.literal("referral"),
      v.literal("manual")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("raffles", {
      ...args,
      status: "active",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("raffles"),
    title: v.optional(v.string()),
    prize: v.optional(v.string()),
    drawDate: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...fields }) => {
    const patch: Record<string, unknown> = {};
    if (fields.title !== undefined) patch.title = fields.title;
    if (fields.prize !== undefined) patch.prize = fields.prize;
    if (fields.drawDate !== undefined) patch.drawDate = fields.drawDate;
    if (fields.description !== undefined) patch.description = fields.description;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("raffles") },
  handler: async (ctx, { id }) => {
    // Delete all entries first
    const entries = await ctx.db
      .query("raffleEntries")
      .withIndex("by_raffle", (q) => q.eq("raffleId", id))
      .collect();
    for (const entry of entries) {
      await ctx.db.delete(entry._id);
    }
    await ctx.db.delete(id);
  },
});

export const addEntry = mutation({
  args: {
    raffleId: v.id("raffles"),
    contactId: v.string(),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    entryMethod: v.union(
      v.literal("email_click"),
      v.literal("sms_yes"),
      v.literal("referral"),
      v.literal("manual")
    ),
    entryWeight: v.optional(v.number()),
  },
  handler: async (ctx, { entryWeight = 1, ...args }) => {
    // Check for duplicate
    const existing = await ctx.db
      .query("raffleEntries")
      .withIndex("by_raffle", (q) => q.eq("raffleId", args.raffleId))
      .filter((q) => q.eq(q.field("contactId"), args.contactId))
      .first();
    if (existing) return "duplicate";

    await ctx.db.insert("raffleEntries", { ...args, entryWeight });
    return "ok";
  },
});

export const drawWinner = mutation({
  args: { id: v.id("raffles") },
  handler: async (ctx, { id }) => {
    const raffle = await ctx.db.get(id);
    if (!raffle) throw new Error("Raffle not found");
    if (raffle.status === "drawn") throw new Error("Winner already drawn");

    const entries = await ctx.db
      .query("raffleEntries")
      .withIndex("by_raffle", (q) => q.eq("raffleId", id))
      .collect();

    if (entries.length === 0) throw new Error("No entries to draw from");

    // Build weighted pool
    const pool: (typeof entries)[0][] = [];
    for (const entry of entries) {
      for (let i = 0; i < entry.entryWeight; i++) {
        pool.push(entry);
      }
    }

    const winner = pool[Math.floor(Math.random() * pool.length)];
    await ctx.db.patch(id, { winnerId: winner._id, status: "drawn" });
    return winner._id;
  },
});

export const closeRaffle = mutation({
  args: { id: v.id("raffles") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { status: "closed" });
  },
});

// Public mutation — no auth required. Called from the tokenized entry endpoint.
export const enterRaffle = mutation({
  args: {
    raffleId: v.id("raffles"),
    contactId: v.string(),
    entryMethod: v.union(
      v.literal("email_click"),
      v.literal("sms_yes"),
      v.literal("referral"),
      v.literal("manual")
    ),
    entryWeight: v.optional(v.number()),
  },
  handler: async (ctx, { raffleId, contactId, entryMethod, entryWeight = 1 }) => {
    const raffle = await ctx.db.get(raffleId);
    if (!raffle) return "not_found";
    if (raffle.status !== "active") return "closed";

    // Check duplicate
    const existing = await ctx.db
      .query("raffleEntries")
      .withIndex("by_raffle", (q) => q.eq("raffleId", raffleId))
      .filter((q) => q.eq(q.field("contactId"), contactId))
      .first();
    if (existing) return "duplicate";

    // Try to pull name/email from contacts table
    let contactName: string | undefined;
    let contactEmail: string | undefined;
    try {
      // contactId is stored as string but represents a contacts doc Id
      const contact = await ctx.db.get(contactId as any);
      if (contact) {
        contactName = (contact as any).name;
        contactEmail = (contact as any).email;
      }
    } catch {
      // contactId may not be a valid doc id — that's fine
    }

    await ctx.db.insert("raffleEntries", {
      raffleId,
      contactId,
      contactName,
      contactEmail,
      entryMethod,
      entryWeight,
    });

    return "ok";
  },
});
