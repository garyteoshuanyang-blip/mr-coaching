import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const s = await auth()
  if (!s?.user || s.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { programId, clientId, startDate } = await req.json()
  if (!programId || !clientId) return NextResponse.json({ error: "Program and Client required" }, { status: 400 })
  const program = await db.program.update({ where: { id: programId }, data: { clientId, status: "active", startDate: startDate ? new Date(startDate) : new Date() } })
  return NextResponse.json({ program })
}