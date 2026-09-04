import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const s = await auth()
  if (!s?.user || s.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const programs = await db.program.findMany({
    include: {
      client: { select: { name: true } },
      weeks: { orderBy: { weekNumber: "asc" }, include: { days: { orderBy: { dayOrder: "asc" }, include: { exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" } } } } } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json({ programs })
}

export async function POST(req: Request) {
  const s = await auth()
  if (!s?.user || s.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, description, weeks } = await req.json()
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

  // Build create data programmatically to avoid inline type annotations
  const weekData = weeks.map((w: any) => ({
    weekNumber: w.weekNumber,
    name: w.name,
    days: {
      create: w.days.map((d: any) => ({
        dayName: d.dayName,
        dayOrder: d.dayOrder,
        exercises: {
          create: d.exercises.map((ex: any) => ({
            exerciseId: ex.exerciseId,
            sortOrder: ex.sortOrder,
            sets: ex.sets,
            reps: ex.reps,
            restSec: ex.restSec,
            rpe: ex.rpe,
            notes: ex.notes,
          })),
        },
      })),
    },
  }))

  const program = await db.program.create({
    data: { name, description, weeks: { create: weekData } },
    include: { weeks: { include: { days: { include: { exercises: { include: { exercise: true } } } } } } },
  })
  return NextResponse.json({ program }, { status: 201 })
}