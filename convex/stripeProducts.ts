"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import StripeSDK from "stripe";

// ---------------------------------------------------------------------------
// Helper — returns a Stripe instance or null if not configured
// ---------------------------------------------------------------------------
function getStripe(): StripeSDK | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new StripeSDK(key);
}

// ---------------------------------------------------------------------------
// Internal actions — called by public wrappers only
// ---------------------------------------------------------------------------

export const listProducts = internalAction({
  args: {},
  handler: async (_ctx, _args) => {
    const stripe = getStripe();
    if (!stripe) {
      return { error: "Stripe is not configured (STRIPE_SECRET_KEY not set)", products: [] };
    }
    try {
      const response = await stripe.products.list({
        active: true,
        expand: ["data.default_price"],
        limit: 100,
      });

      const products = response.data.map((product) => {
        const price = product.default_price as StripeSDK.Price | null;
        return {
          id: product.id,
          name: product.name,
          description: product.description ?? "",
          active: product.active,
          created: product.created,
          defaultPrice: price
            ? {
                id: price.id,
                amount: price.unit_amount ?? 0,
                currency: price.currency,
                type: price.type,
              }
            : null,
        };
      });

      return { error: null, products };
    } catch (err) {
      return { error: String(err), products: [] };
    }
  },
});

export const createProduct = internalAction({
  args: {
    name: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (_ctx, args) => {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is not configured");

    const product = await stripe.products.create({
      name: args.name,
      description: args.description || undefined,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: args.amount,
      currency: args.currency,
    });

    await stripe.products.update(product.id, {
      default_price: price.id,
    });

    return { id: product.id, priceId: price.id };
  },
});

export const updateProduct = internalAction({
  args: {
    stripeProductId: v.string(),
    name: v.string(),
    description: v.string(),
  },
  handler: async (_ctx, args) => {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is not configured");

    await stripe.products.update(args.stripeProductId, {
      name: args.name,
      description: args.description || undefined,
    });

    return { id: args.stripeProductId };
  },
});

export const archiveProduct = internalAction({
  args: {
    stripeProductId: v.string(),
  },
  handler: async (_ctx, args) => {
    const stripe = getStripe();
    if (!stripe) throw new Error("Stripe is not configured");

    await stripe.products.update(args.stripeProductId, { active: false });
    return { id: args.stripeProductId };
  },
});

// ---------------------------------------------------------------------------
// Public action wrappers — called from admin pages
// ---------------------------------------------------------------------------

type ProductResult = {
  error: string | null;
  products: Array<{
    id: string;
    name: string;
    description: string;
    active: boolean;
    created: number;
    defaultPrice: { id: string; amount: number; currency: string; type: string } | null;
  }>;
};

export const adminListProducts = action({
  args: {},
  handler: async (ctx, _args): Promise<ProductResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.runAction(internal.stripeProducts.listProducts, {}) as ProductResult;
  },
});

export const adminCreateProduct = action({
  args: {
    name: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, args): Promise<{ id: string; priceId: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.runAction(internal.stripeProducts.createProduct, args) as any;
  },
});

export const adminUpdateProduct = action({
  args: {
    stripeProductId: v.string(),
    name: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args): Promise<{ id: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.runAction(internal.stripeProducts.updateProduct, args) as any;
  },
});

export const adminArchiveProduct = action({
  args: {
    stripeProductId: v.string(),
  },
  handler: async (ctx, args): Promise<{ id: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.runAction(internal.stripeProducts.archiveProduct, args) as any;
  },
});
