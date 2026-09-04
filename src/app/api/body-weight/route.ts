import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const s = await auth()
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const logs = await db.bodyWeightLog.findMany({ where: { clientId: s.user.id }, orderBy: { date: "asc" } })
  return NextResponse.json({ logs })
}

export async function POST(req: Request) {
  const s = await auth()
  if (!s?.user || s.user.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { weight } = await req.json()
  if (!weight) return NextResponse.json({ error: "Weight required" }, { status: 400 })
  const log = await db.bodyWeightLog.create({ data: { clientId: s.user.id, weight } })
  return NextResponse.json({ log }, { status: 201 })
}