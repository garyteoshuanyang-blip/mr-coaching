import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const programs = await db.program.findMany({
    include: { client: { select: { name: true } }, weeks: { orderBy: { weekNumber: "asc" }, include: { days: { orderBy: { dayOrder: "asc" }, include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } } } } } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ programs })
}

export async function POST(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const { name, description, weeks } = await req.json()
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

  const weekData = weeks.map((w: any) => ({
    weekNumber: w.weekNumber,
    name: w.name,
    days: { create: w.days.map((d: any) => ({
      dayName: d.dayName, dayOrder: d.dayOrder,
      exercises: { create: d.exercises.map((ex: any) => ({
        exerciseId: ex.exerciseId, sortOrder: ex.sortOrder,
        sets: ex.sets, reps: ex.reps, restSec: ex.restSec, rpe: ex.rpe, notes: ex.notes,
      })) },
    })) },
  }))

  const program = await db.program.create({
    data: { name, description, weeks: { create: weekData } },
    include: { weeks: { include: { days: { include: { exercises: { include: { exercise: true } } } } } } },
  })
  return NextResponse.json({ program }, { status: 201 })
}