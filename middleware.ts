import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get("session_id")?.value;

  if (!sessionId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Prisma is unavailable in Edge Runtime — use Supabase JS client for raw DB access
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Service-role key required: this query bypasses RLS to read Session+User
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {}, // read-only context in middleware
      },
    }
  );

  const { data: session, error } = await supabase
    .from("Session")
    .select("expiresAt, user:User(role, status)")
    .eq("id", sessionId)
    .single();

  if (error || !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Session expired
  if (new Date(session.expiresAt) < new Date()) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session_id");
    return response;
  }

  const user = Array.isArray(session.user) ? session.user[0] : session.user;

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
