import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user) return unauth()
  const logs = await db.bodyWeightLog.findMany({ where: { clientId: user.id }, orderBy: { date: "asc" } })
  return NextResponse.json({ logs })
}

export async function POST(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "client") return unauth()
  const { weight } = await req.json()
  if (!weight) return NextResponse.json({ error: "Weight required" }, { status: 400 })
  const log = await db.bodyWeightLog.create({ data: { clientId: user.id, weight } })
  return NextResponse.json({ log }, { status: 201 })
}