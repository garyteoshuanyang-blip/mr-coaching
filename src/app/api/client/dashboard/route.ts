import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const s = await auth()
  if (!s?.user || s.user.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const programs = await db.program.findMany({ where: { clientId: s.user.id }, include: { weeks: { orderBy: { weekNumber: "asc" }, include: { days: { orderBy: { dayOrder: "asc" } } } } }, orderBy: { createdAt: "desc" } })
  const activePrograms = programs.filter(p => p.status === "active").length
  const totalPrograms = programs.length
  const today = new Date(); today.setHours(0,0,0,0); const end = new Date(today); end.setHours(23,59,59,999)
  const todayWorkouts = await db.workoutLog.count({ where: { clientId: s.user.id, date: { gte: today, lte: end }, completed: true } })
  const lastWeight = await db.bodyWeightLog.findFirst({ where: { clientId: s.user.id }, orderBy: { date: "desc" }, select: { weight: true } })
  return NextResponse.json({ activePrograms, totalPrograms, todayWorkouts, lastWeight: lastWeight?.weight||null })
}