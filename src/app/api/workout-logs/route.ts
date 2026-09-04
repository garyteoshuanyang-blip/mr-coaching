import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const s = await auth()
  if (!s?.user || s.user.role !== "client") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { workoutExerciseId, date, loggedSets, completed } = await req.json()
  if (!workoutExerciseId) return NextResponse.json({ error: "workoutExerciseId required" }, { status: 400 })
  const existing = await db.workoutLog.findUnique({ where: { clientId_workoutExerciseId_date: { clientId: s.user.id, workoutExerciseId, date: new Date(date || new Date()) } } })
  let log
  if (existing) log = await db.workoutLog.update({ where: { id: existing.id }, data: { loggedSets, completed } })
  else log = await db.workoutLog.create({ data: { clientId: s.user.id, workoutExerciseId, date: new Date(date || new Date()), loggedSets, completed } })
  return NextResponse.json({ log })
}

export async function GET(req: Request) {
  const s = await auth()
  if (!s?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url); const programId = searchParams.get("programId"); const date = searchParams.get("date")
  const where: any = { clientId: s.user.id }
  if (programId) where.workoutExercise = { day: { week: { programId } } }
  if (date) { const d = new Date(date); d.setHours(0,0,0,0); const e = new Date(d); e.setHours(23,59,59,999); where.date = { gte: d, lte: e } }
  const logs = await db.workoutLog.findMany({ where, include: { workoutExercise: { include: { exercise: true, day: { include: { week: true } } } } }, orderBy: { date: "desc" } })
  return NextResponse.json({ logs })
}