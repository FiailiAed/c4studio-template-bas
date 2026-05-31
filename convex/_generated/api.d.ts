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
import type * as contacts from "../contacts.js";
import type * as email from "../email.js";
import type * as emailLogs from "../emailLogs.js";
import type * as emailTemplates from "../emailTemplates.js";
import type * as funnels from "../funnels.js";
import type * as http from "../http.js";
import type * as payments from "../payments.js";
import type * as settings from "../settings.js";
import type * as shops from "../shops.js";
import type * as sitePages from "../sitePages.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bookingLinks: typeof bookingLinks;
  contacts: typeof contacts;
  email: typeof email;
  emailLogs: typeof emailLogs;
  emailTemplates: typeof emailTemplates;
  funnels: typeof funnels;
  http: typeof http;
  payments: typeof payments;
  settings: typeof settings;
  shops: typeof shops;
  sitePages: typeof sitePages;
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
