import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

  const [clientCount, activePrograms, totalExercises, recentClients, activeClientIds, staleClientIds, programsWithLogs] = await Promise.all([
    db.user.count({ where: { role: "client" } }),
    db.program.count({ where: { status: "active" } }),
    db.exercise.count(),
    db.user.findMany({
      where: { role: "client" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        clientSlug: true,
        _count: { select: { assignedPrograms: true } },
      },
    }),

    // Clients who logged a workout in the last 7 days
    db.user.findMany({
      where: {
        role: "client",
        workoutLogs: { some: { date: { gte: sevenDaysAgo } } },
      },
      select: { id: true },
    }),

    // Clients who haven't logged in 14+ days (but have at least one program)
    db.user.findMany({
      where: {
        role: "client",
        assignedPrograms: { some: { status: "active" } },
        NOT: {
          workoutLogs: { some: { date: { gte: fourteenDaysAgo } } },
        },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),

    // Programs with at least one completed workout log
    // Use the week→day→workoutExercise→workoutLog chain
    db.workoutLog.findMany({
      where: {
        completed: true,
        workoutExercise: {
          day: {
            week: {
              program: {
                clientId: { not: null },
                status: "active",
              },
            },
          },
        },
      },
      select: {
        workoutExercise: {
          select: {
            day: {
              select: {
                week: {
                  select: {
                    programId: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ])

  // Deduplicate program IDs that have at least one completed log
  const programIdsWithLogs = new Set(programsWithLogs.map(l => l.workoutExercise.day.week.programId))

  // Total assigned active programs
  const totalAssignedPrograms = await db.program.count({
    where: { clientId: { not: null }, status: "active" },
  })

  return NextResponse.json({
    clientCount,
    activePrograms,
    totalExercises,
    recentClients: recentClients.map(c => ({
      id: c.id,
      name: c.name,
      programCount: c._count.assignedPrograms,
    })),
    activeClientCount: activeClientIds.length,
    staleClients: staleClientIds.map(c => c.name),
    staleClientCount: staleClientIds.length,
    completionPct: totalAssignedPrograms > 0
      ? Math.round((programIdsWithLogs.size / totalAssignedPrograms) * 100)
      : 0,
    programsWithLogs: programIdsWithLogs.size,
    totalAssignedPrograms,
  })
}