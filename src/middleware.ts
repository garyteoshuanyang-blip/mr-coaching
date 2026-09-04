import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default async function middleware(req: Request) {
  const session = await auth()
  const url = new URL(req.url)
  const { pathname } = url

  if (pathname === "/login" || pathname.startsWith("/api/auth")) return NextResponse.next()
  if (pathname === "/") {
    if (!session?.user) return NextResponse.redirect(new URL("/login", req.url))
    if (session.user.role === "admin") return NextResponse.redirect(new URL("/admin", req.url))
    return NextResponse.redirect(new URL("/client", req.url))
  }
  if (!session?.user) return NextResponse.redirect(new URL("/login", req.url))
  if (pathname.startsWith("/admin") && session.user.role !== "admin") return NextResponse.redirect(new URL("/client", req.url))
  if (pathname.startsWith("/client") && session.user.role !== "client") return NextResponse.redirect(new URL("/admin", req.url))
  return NextResponse.next()
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"] }