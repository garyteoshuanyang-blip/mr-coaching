import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const clientId = new URL(req.url).searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })
  const client = await db.user.findUnique({ where: { id: clientId }, select: { name: true, clientSlug: true } })
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 })
  const session = null // AI suggestion placeholder — no AI integration yet
  return NextResponse.json({ suggestion: null, clientName: client.name })
}