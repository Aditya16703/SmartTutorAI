import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protect these routes - users must be signed in
const isProtectedRoute = createRouteMatcher([
  "/learn(.*)",
  "/profile(.*)", 
  "/dashboard(.*)"
]);

export default clerkMiddleware(async (auth, req) => {
  // E2E Test Bypass: Allows programmatic testing of protected routes
  const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === "true";
  
  if (isProtectedRoute(req) && !isTestMode) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};