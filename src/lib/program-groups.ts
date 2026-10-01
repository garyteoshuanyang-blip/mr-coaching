import { db } from "@/lib/db"
import { groupLabel } from "@/lib/group-label"

export { groupLabel }

export const GROUP_INCLUDE = { orderBy: { sortOrder: "asc" as const } }

/**
 * Create WorkoutGroup rows for a freshly created program from the builder payload,
 * then link the member exercises. Groups with fewer than 2 members are skipped —
 * a superset needs at least two exercises.
 *
 * payloadWeeks shape:
 *   [{ weekNumber, days: [{ dayOrder,
 *        groups: [{ label, restAfterSec }],
 *        exercises: [{ exerciseId, groupLabel }] }] }]
 */
export async function applyGroupPayload(programId: string, payloadWeeks: any[]) {
  if (!Array.isArray(payloadWeeks)) return
  const createdWeeks = await db.week.findMany({
    where: { programId },
    include: { days: { include: { exercises: true } } },
  })

  for (const w of payloadWeeks) {
    const cw = createdWeeks.find((c) => c.weekNumber === w.weekNumber)
    if (!cw) continue
    for (const d of w.days || []) {
      const cd = cw.days.find((c) => c.dayOrder === d.dayOrder)
      if (!cd) continue

      const labels: string[] = []
      for (const ex of d.exercises || []) {
        if (ex.groupLabel && !labels.includes(ex.groupLabel)) labels.push(ex.groupLabel)
      }

      let order = 0
      for (const label of labels) {
        const members = (d.exercises || []).filter((e: any) => e.groupLabel === label)
        if (members.length < 2) continue
        order += 1
        const g = await db.workoutGroup.create({
          data: {
            dayId: cd.id,
            label,
            sortOrder: order,
            restAfterSec: (d.groups || []).find((x: any) => x.label === label)?.restAfterSec ?? null,
          },
        })
        for (const m of members) {
          const ce = cd.exercises.find((c) => c.exerciseId === m.exerciseId)
          if (ce) await db.workoutExercise.update({ where: { id: ce.id }, data: { groupId: g.id } })
        }
      }
    }
  }
}

/** Mirror the group structure of one program onto another (used by clone). */
export async function cloneGroups(originalProgramId: string, clonedProgramId: string) {
  const [origWeeks, cloneWeeks] = await Promise.all([
    db.week.findMany({
      where: { programId: originalProgramId },
      include: {
        days: {
          include: {
            groups: { orderBy: { sortOrder: "asc" }, include: { exercises: { orderBy: { sortOrder: "asc" } } } },
            exercises: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    }),
    db.week.findMany({
      where: { programId: clonedProgramId },
      include: { days: { include: { exercises: { orderBy: { sortOrder: "asc" } } } } },
    }),
  ])

  for (const ow of origWeeks) {
    const cw = cloneWeeks.find((c) => c.weekNumber === ow.weekNumber)
    if (!cw) continue
    for (const od of ow.days) {
      const cd = cw.days.find((c) => c.dayOrder === od.dayOrder)
      if (!cd) continue
      for (const og of od.groups) {
        const g = await db.workoutGroup.create({
          data: { dayId: cd.id, label: og.label, sortOrder: og.sortOrder, restAfterSec: og.restAfterSec },
        })
        for (const oex of og.exercises) {
          const cex = cd.exercises.find((c) => c.exerciseId === oex.exerciseId)
          if (cex) await db.workoutExercise.update({ where: { id: cex.id }, data: { groupId: g.id } })
        }
      }
    }
  }
}

/** Standard day include: groups + exercises with their library exercise. */
export const DAY_INCLUDE = {
  orderBy: { dayOrder: "asc" as const },
  include: {
    groups: { orderBy: { sortOrder: "asc" as const } },
    exercises: { include: { exercise: true }, orderBy: { sortOrder: "asc" as const } },
  },
}
