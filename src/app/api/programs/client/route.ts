import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const s = await auth()
  if (!s?.user || s.user.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const programs = await db.program.findMany({ where: { clientId: s.user.id }, include: { weeks: { orderBy: { weekNumber: "asc" }, include: { days: { orderBy: { dayOrder: "asc" }, include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } } } } } } }, orderBy: { createdAt: "desc" } })
  return NextResponse.json({ programs })
}