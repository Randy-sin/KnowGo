import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 定义公开路由 - 这些路由不需要登录就能访问
const isPublicRoute = createRouteMatcher([
  '/',              // 主页
  '/sign-in(.*)'    // 统一的登录/注册页面及其子路由
]);

export default clerkMiddleware(async (auth, req) => {
  // 如果不是公开路由，需要保护
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}; 