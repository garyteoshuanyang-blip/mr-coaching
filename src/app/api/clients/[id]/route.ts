import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const client = await db.user.findUnique({
    where: { id, role: "client" },
    include: {
      assignedPrograms: {
        include: { weeks: { orderBy: { weekNumber: "asc" }, include: { days: { orderBy: { dayOrder: "asc" }, include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } } } } } } },
        orderBy: { createdAt: "desc" },
      },
      bodyWeightLogs: { orderBy: { date: "desc" }, take: 30 },
    },
  })
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const { name, clientSlug } = await req.json()
  const data: any = {}
  if (name) data.name = name
  if (clientSlug) {
    const normalized = clientSlug.toLowerCase().replace(/\s+/g, "")
    const existing = await db.user.findFirst({ where: { clientSlug: normalized, id: { not: id } } })
    if (existing) return NextResponse.json({ error: "Slug taken" }, { status: 409 })
    data.clientSlug = normalized
  }
  const updated = await db.user.update({ where: { id }, data })
  return NextResponse.json({ client: { id: updated.id, name: updated.name, clientSlug: updated.clientSlug } })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  await db.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}