import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const clients = await db.user.findMany({ where: { role: "client" }, include: { _count: { select: { assignedPrograms: true } } }, orderBy: { name: "asc" } })
  return NextResponse.json({ clients })
}

export async function POST(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const data = await req.json()
  if (!data.name) return NextResponse.json({ error: "Name required" }, { status: 400 })

  // Auto-generate slug
  let slug = data.name.toLowerCase().replace(/\s+/g, "")
  let exists = await db.user.findUnique({ where: { clientSlug: slug } })
  let counter = 1
  while (exists) {
    slug = data.name.toLowerCase().replace(/\s+/g, "") + counter
    exists = await db.user.findUnique({ where: { clientSlug: slug } })
    counter++
  }

  const client = await db.user.create({ data: { name: data.name, clientSlug: slug, role: "client" } })
  return NextResponse.json({ client: { id: client.id, name: client.name, slug: client.clientSlug } }, { status: 201 })
}