import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function POST(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const { programId, clientId, startDate } = await req.json()
  if (!programId || !clientId) return NextResponse.json({ error: "Program and Client required" }, { status: 400 })
  const program = await db.program.update({ where: { id: programId }, data: { clientId, status: "active", startDate: startDate ? new Date(startDate) : new Date() } })
  return NextResponse.json({ program })
}