import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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