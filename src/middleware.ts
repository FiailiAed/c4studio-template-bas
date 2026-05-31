import { clerkMiddleware, createRouteMatcher } from '@clerk/astro/server';

const isProtectedRoute = createRouteMatcher(['/admin(.*)', '/dashboard(.*)']);

export const onRequest = clerkMiddleware((auth, context) => {
  const authObject = auth();
  if (isProtectedRoute(context.request) && !authObject.userId) {
    return authObject.redirectToSignIn();
  }
});
