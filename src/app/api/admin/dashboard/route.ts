import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const [clientCount, activePrograms, totalExercises, recentClients] = await Promise.all([
    db.user.count({ where: { role: "client" } }),
    db.program.count({ where: { status: "active" } }),
    db.exercise.count(),
    db.user.findMany({ where: { role: "client" }, include: { _count: { select: { assignedPrograms: true } } }, orderBy: { createdAt: "desc" }, take: 10 }),
  ])
  return NextResponse.json({
    clientCount, activePrograms, totalExercises,
    recentClients: recentClients.map(c => ({ id: c.id, name: c.name, programCount: c._count.assignedPrograms })),
  })
}