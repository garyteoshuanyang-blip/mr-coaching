import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json({ user })
}