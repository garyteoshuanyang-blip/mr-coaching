import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const s = await auth()
  if (!s?.user || s.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const client = await db.user.findUnique({ where: { id, role: "client" }, include: { assignedPrograms: { include: { weeks: { orderBy: { weekNumber: "asc" }, include: { days: { orderBy: { dayOrder: "asc" }, include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } } } } } } }, orderBy: { createdAt: "desc" } }, bodyWeightLogs: { orderBy: { date: "desc" }, take: 30 } } })
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(client)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const s = await auth()
  if (!s?.user || s.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await db.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}