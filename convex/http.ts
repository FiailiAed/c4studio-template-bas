import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";
import type Stripe from "stripe";

const http = httpRouter();

registerRoutes(http, components.stripe, {
  webhookPath: "/stripe/webhook",
  onEvent: async (_ctx, event: Stripe.Event) => {
    console.log("Stripe event received:", event.type);
  },
});

export default http;
