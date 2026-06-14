/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bookingLinks from "../bookingLinks.js";
import type * as bookings from "../bookings.js";
import type * as contacts from "../contacts.js";
import type * as devTasks from "../devTasks.js";
import type * as email from "../email.js";
import type * as emailLogs from "../emailLogs.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as funnels from "../funnels.js";
import type * as gallery from "../gallery.js";
import type * as http from "../http.js";
import type * as nurturing from "../nurturing.js";
import type * as nurturingActions from "../nurturingActions.js";
import type * as payments from "../payments.js";
import type * as posts from "../posts.js";
import type * as pricing from "../pricing.js";
import type * as raffles from "../raffles.js";
import type * as reactivation from "../reactivation.js";
import type * as reactivationActions from "../reactivationActions.js";
import type * as reviewActions from "../reviewActions.js";
import type * as reviews from "../reviews.js";
import type * as settings from "../settings.js";
import type * as shopItems from "../shopItems.js";
import type * as shops from "../shops.js";
import type * as sitePages from "../sitePages.js";
import type * as stripeProducts from "../stripeProducts.js";
import type * as testimonials from "../testimonials.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bookingLinks: typeof bookingLinks;
  bookings: typeof bookings;
  contacts: typeof contacts;
  devTasks: typeof devTasks;
  email: typeof email;
  emailLogs: typeof emailLogs;
  emailTemplates: typeof emailTemplates;
  funnels: typeof funnels;
  gallery: typeof gallery;
  http: typeof http;
  nurturing: typeof nurturing;
  nurturingActions: typeof nurturingActions;
  payments: typeof payments;
  posts: typeof posts;
  pricing: typeof pricing;
  raffles: typeof raffles;
  reactivation: typeof reactivation;
  reactivationActions: typeof reactivationActions;
  reviewActions: typeof reviewActions;
  reviews: typeof reviews;
  settings: typeof settings;
  shopItems: typeof shopItems;
  shops: typeof shops;
  sitePages: typeof sitePages;
  stripeProducts: typeof stripeProducts;
  testimonials: typeof testimonials;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  stripe: import("@convex-dev/stripe/_generated/component.js").ComponentApi<"stripe">;
};
