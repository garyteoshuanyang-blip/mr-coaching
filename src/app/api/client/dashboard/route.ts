import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user) return unauth()

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const [activePrograms, totalPrograms, todayWorkouts, lastWeightLog] = await Promise.all([
    db.program.count({
      where: { clientId: user.id, status: "active" },
    }),
    db.program.count({
      where: { clientId: user.id },
    }),
    db.workoutLog.count({
      where: { clientId: user.id, date: { gte: todayStart } },
    }),
    db.bodyWeightLog.findFirst({
      where: { clientId: user.id },
      orderBy: { date: "desc" },
      select: { weight: true },
    }),
  ])

  return NextResponse.json({
    activePrograms,
    totalPrograms,
    todayWorkouts,
    lastWeight: lastWeightLog?.weight ?? null,
  })
}