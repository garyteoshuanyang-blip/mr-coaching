import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "client") return unauth()

  const programs = await db.program.findMany({
    where: { clientId: user.id },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { dayOrder: "asc" },
            include: {
              exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const activePrograms = programs.filter(p => p.status === "active")
  const totalPrograms = programs.length
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999)
  const todayWorkouts = await db.workoutLog.count({
    where: { clientId: user.id, date: { gte: today, lte: todayEnd }, completed: true },
  })
  const lastLog = await db.workoutLog.findFirst({ where: { clientId: user.id }, orderBy: { date: "desc" }, select: { date: true } })
  const lastWeight = await db.bodyWeightLog.findFirst({ where: { clientId: user.id }, orderBy: { date: "desc" }, select: { weight: true } })
  const recentPrograms = programs.slice(0, 3).map(p => ({ id: p.id, name: p.name, weeksCount: p.weeks.length, daysCount: p.weeks.reduce((s, w) => s + w.days.length, 0) }))

  return NextResponse.json({ activePrograms: activePrograms.length, totalPrograms, todayWorkouts, lastLogged: lastLog?.date?.toISOString() || null, lastWeight: lastWeight?.weight || null, recentPrograms })
}