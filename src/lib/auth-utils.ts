import { SignJWT, jwtVerify } from "jose"
import { NextResponse } from "next/server"

const SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "mr-coaching-jwt-secret")

export interface TokenPayload {
  id: string
  name: string
  role: "admin" | "client"
  clientSlug?: string
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

export function getTokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) return auth.slice(7)
  return null
}

export async function getAuthUser(req: Request): Promise<TokenPayload | null> {
  const token = getTokenFromRequest(req)
  if (!token) return null
  return await verifyToken(token)
}

export function unauth() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}