import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()

  // Fetch original program with full tree
  const original = await db.program.findUnique({
    where: { id },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { dayOrder: "asc" },
            include: {
              exercises: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  })
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Deep-copy: map weeks → days → exercises into Prisma nested create format
  const weekData = original.weeks.map((w) => ({
    weekNumber: w.weekNumber,
    name: w.name,
    days: {
      create: w.days.map((d) => ({
        dayName: d.dayName,
        dayOrder: d.dayOrder,
        exercises: {
          create: d.exercises.map((ex) => ({
            exerciseId: ex.exerciseId,
            sortOrder: ex.sortOrder,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            restSec: ex.restSec,
            rpe: ex.rpe,
            notes: ex.notes,
          })),
        },
      })),
    },
  }))

  const cloned = await db.program.create({
    data: {
      name: `${original.name} (Copy)`,
      description: original.description,
      status: "active" as const,
      clientId: null, // always a template; use Assign flow to link to client
      weeks: { create: weekData },
    },
    select: { id: true, name: true },
  })

  return NextResponse.json({ id: cloned.id, name: cloned.name }, { status: 201 })
}