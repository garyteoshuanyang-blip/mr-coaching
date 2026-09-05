import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createToken } from "@/lib/auth-utils"

export async function POST(req: Request) {
  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: "Name required" }, { status: 400 })

  const normalized = slug.toLowerCase().replace(/\s+/g, "")
  const user = await db.user.findUnique({ where: { clientSlug: normalized } })
  if (!user || user.role !== "client") return NextResponse.json({ error: "Client not found" }, { status: 404 })

  const token = await createToken({ id: user.id, name: user.name, role: "client", clientSlug: normalized })

  return NextResponse.json({
    token, user: { id: user.id, name: user.name, role: user.role },
  })
}