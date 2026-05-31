import { action, query } from "./_generated/server";
import { components } from "./_generated/api";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { v } from "convex/values";

const stripe = new StripeSubscriptions(components.stripe, {});

// --- Checkout ---

export const createSubscriptionCheckout = action({
  args: {
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { customerId } = await stripe.getOrCreateCustomer(ctx, {
      userId: identity.tokenIdentifier,
      email: identity.email,
      name: identity.name,
    });

    return await stripe.createCheckoutSession(ctx, {
      priceId: args.priceId,
      customerId,
      mode: "subscription",
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
      subscriptionMetadata: { userId: identity.tokenIdentifier },
    });
  },
});

export const createPaymentCheckout = action({
  args: {
    priceId: v.string(),
    successUrl: v.string(),
    cancelUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { customerId } = await stripe.getOrCreateCustomer(ctx, {
      userId: identity.tokenIdentifier,
      email: identity.email,
      name: identity.name,
    });

    return await stripe.createCheckoutSession(ctx, {
      priceId: args.priceId,
      customerId,
      mode: "payment",
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
      paymentIntentMetadata: { userId: identity.tokenIdentifier },
    });
  },
});

// --- Customer Portal ---

export const createPortalSession = action({
  args: { returnUrl: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const { customerId } = await stripe.getOrCreateCustomer(ctx, {
      userId: identity.tokenIdentifier,
      email: identity.email,
      name: identity.name,
    });

    return await stripe.createCustomerPortalSession(ctx, {
      customerId,
      returnUrl: args.returnUrl,
    });
  },
});

// --- Subscription management ---

export const cancelSubscription = action({
  args: {
    stripeSubscriptionId: v.string(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await stripe.cancelSubscription(ctx, {
      stripeSubscriptionId: args.stripeSubscriptionId,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? true,
    });
  },
});

export const reactivateSubscription = action({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await stripe.reactivateSubscription(ctx, {
      stripeSubscriptionId: args.stripeSubscriptionId,
    });
  },
});

// --- Queries (via component public tables) ---

export const listSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.runQuery(components.stripe.public.listSubscriptionsByUserId, {
      userId: identity.tokenIdentifier,
    });
  },
});

export const listPayments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.runQuery(components.stripe.public.listPaymentsByUserId, {
      userId: identity.tokenIdentifier,
    });
  },
});
