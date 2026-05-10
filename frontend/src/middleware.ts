import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/settings", "/transactions", "/budgets", "/transacciones", "/presupuestos", "/categorias", "/gastos-fijos", "/configuracion"];

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const isProtected = protectedRoutes.some((route) => url.pathname.startsWith(route));

  const hasSession = request.cookies.has("sb-access-token");

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && (url.pathname === "/login" || url.pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
