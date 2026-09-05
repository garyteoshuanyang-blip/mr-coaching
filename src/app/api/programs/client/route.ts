import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "client") return unauth()
  const programs = await db.program.findMany({
    where: { clientId: user.id },
    include: {
      weeks: { orderBy: { weekNumber: "asc" }, include: { days: { orderBy: { dayOrder: "asc" }, include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } } } } } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ programs })
}