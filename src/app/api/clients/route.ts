import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { hash } from "bcryptjs"

export async function GET() {
  const s = await auth()
  if (!s?.user || s.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const clients = await db.user.findMany({ where: { role: "client" }, include: { _count: { select: { assignedPrograms: true } } }, orderBy: { name: "asc" } })
  return NextResponse.json({ clients })
}

export async function POST(req: Request) {
  const s = await auth()
  if (!s?.user || s.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, email, password } = await req.json()
  if (!name || !email || !password) return NextResponse.json({ error: "All fields required" }, { status: 400 })
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email in use" }, { status: 409 })
  const client = await db.user.create({ data: { name, email, hashedPassword: await hash(password, 12), role: "client" } })
  return NextResponse.json({ client: { id: client.id, name: client.name, email: client.email } }, { status: 201 })
}