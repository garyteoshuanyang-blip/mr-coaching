import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const s = await auth()
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const program = await db.program.findUnique({ where: { id }, include: { client: { select: { id: true, name: true } }, weeks: { orderBy: { weekNumber: "asc" }, include: { days: { orderBy: { dayOrder: "asc" }, include: { exercises: { include: { exercise: true, logs: { where: { clientId: s.user.id || "" }, orderBy: { date: "desc" }, take: 3 } }, orderBy: { sortOrder: "asc" } } } } } } } })
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (s.user.role === "client" && program.clientId !== s.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  return NextResponse.json(program)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const s = await auth()
  if (!s?.user || s.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, description, status } = await req.json()
  const program = await db.program.update({ where: { id }, data: { name, description, status } })
  return NextResponse.json({ program })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const s = await auth()
  if (!s?.user || s.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await db.program.delete({ where: { id } })
  return NextResponse.json({ success: true })
}