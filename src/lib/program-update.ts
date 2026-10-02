import { db } from "@/lib/db"
import { applyGroupPayload } from "@/lib/program-groups"

type PWeek = { weekNumber: number; name?: string; days: any[] }

/**
 * Work out what a proposed edit would REMOVE, and how many client workout logs
 * that costs. Used to hard-stop an edit that would silently destroy history.
 */
export async function computeEditImpact(programId: string, payloadWeeks: PWeek[]) {
  const existing = await db.week.findMany({
    where: { programId },
    include: { days: { include: { exercises: true } } },
  })

  const keepWeek = new Map(payloadWeeks.map((w) => [w.weekNumber, w]))
  const exIdsToDelete: string[] = []

  for (const w of existing) {
    const pw = keepWeek.get(w.weekNumber)
    if (!pw) {
      w.days.forEach((d) => d.exercises.forEach((e) => exIdsToDelete.push(e.id)))
      continue
    }
    const keepDay = new Map((pw.days || []).map((d: any) => [d.dayOrder, d]))
    for (const d of w.days) {
      const pd = keepDay.get(d.dayOrder)
      if (!pd) {
        d.exercises.forEach((e) => exIdsToDelete.push(e.id))
        continue
      }
      const keepEx = new Set((pd.exercises || []).map((e: any) => e.exerciseId))
      for (const e of d.exercises) if (!keepEx.has(e.exerciseId)) exIdsToDelete.push(e.id)
    }
  }

  const logsToDelete = exIdsToDelete.length
    ? await db.workoutLog.count({ where: { workoutExerciseId: { in: exIdsToDelete } } })
    : 0

  return { exercisesToDelete: exIdsToDelete, logsToDelete }
}

function dayCreate(d: any) {
  return {
    dayName: d.dayName,
    dayOrder: d.dayOrder,
    exercises: {
      create: (d.exercises || []).map((e: any) => ({
        exerciseId: e.exerciseId,
        sortOrder: e.sortOrder,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight ?? null,
        restSec: e.restSec ?? null,
        rpe: e.rpe || null,
        notes: e.notes || null,
      })),
    },
  }
}

function exData(pe: any) {
  return {
    sortOrder: pe.sortOrder,
    sets: pe.sets,
    reps: pe.reps,
    weight: pe.weight ?? null,
    restSec: pe.restSec ?? null,
    rpe: pe.rpe || null,
    notes: pe.notes || null,
  }
}

/**
 * Apply a builder payload onto an EXISTING program by DIFFING, not recreating.
 * WorkoutExercise rows are matched on exerciseId within a day and updated in
 * place, so their IDs survive — and therefore so do the client's WorkoutLogs
 * (WorkoutLog.workoutExercise is onDelete: Cascade).
 *
 * Matching keys: week → weekNumber, day → dayOrder, exercise → exerciseId.
 */
export async function diffApplyWeeks(programId: string, payloadWeeks: PWeek[]) {
  const existing = await db.week.findMany({
    where: { programId },
    include: { days: { include: { exercises: true } } },
  })
  const weekByNumber = new Map(existing.map((w) => [w.weekNumber, w]))

  // Phase 1 — park all week numbers on negatives so renumbering can't hit
  // the @@unique([programId, weekNumber]) constraint mid-flight.
  for (let i = 0; i < existing.length; i++) {
    await db.week.update({ where: { id: existing[i].id }, data: { weekNumber: -(i + 1) } })
  }

  const seenWeekNumbers = new Set<number>()

  for (const pw of payloadWeeks) {
    seenWeekNumbers.add(pw.weekNumber)
    const ew = weekByNumber.get(pw.weekNumber)

    if (!ew) {
      await db.week.create({
        data: {
          programId,
          weekNumber: pw.weekNumber,
          name: pw.name ?? `Week ${pw.weekNumber}`,
          days: { create: (pw.days || []).map(dayCreate) },
        },
      })
      continue
    }

    await db.week.update({
      where: { id: ew.id },
      data: { weekNumber: pw.weekNumber, name: pw.name ?? ew.name },
    })

    // Park this week's day orders for the same reason (@@unique([weekId, dayOrder]))
    for (let i = 0; i < ew.days.length; i++) {
      await db.workoutDay.update({ where: { id: ew.days[i].id }, data: { dayOrder: -(i + 1) } })
    }
    const dayByOrder = new Map(ew.days.map((d) => [d.dayOrder, d]))
    const seenDayOrders = new Set<number>()

    for (const pd of pw.days || []) {
      seenDayOrders.add(pd.dayOrder)
      const ed = dayByOrder.get(pd.dayOrder)

      if (!ed) {
        await db.workoutDay.create({ data: { weekId: ew.id, ...dayCreate(pd) } })
        continue
      }

      await db.workoutDay.update({
        where: { id: ed.id },
        data: { dayName: pd.dayName, dayOrder: pd.dayOrder },
      })

      const exByExerciseId = new Map(ed.exercises.map((e) => [e.exerciseId, e]))
      const seenEx = new Set<string>()

      for (const pe of pd.exercises || []) {
        seenEx.add(pe.exerciseId)
        const ee = exByExerciseId.get(pe.exerciseId)
        if (ee) {
          // Update in place — ID (and its logs) survive
          await db.workoutExercise.update({ where: { id: ee.id }, data: exData(pe) })
        } else {
          await db.workoutExercise.create({
            data: { dayId: ed.id, exerciseId: pe.exerciseId, ...exData(pe) },
          })
        }
      }

      const removedEx = ed.exercises.filter((e) => !seenEx.has(e.exerciseId)).map((e) => e.id)
      if (removedEx.length) await db.workoutExercise.deleteMany({ where: { id: { in: removedEx } } })
    }

    const removedDays = ew.days.filter((d) => !seenDayOrders.has(d.dayOrder)).map((d) => d.id)
    if (removedDays.length) await db.workoutDay.deleteMany({ where: { id: { in: removedDays } } })
  }

  const removedWeeks = existing.filter((w) => !seenWeekNumbers.has(w.weekNumber)).map((w) => w.id)
  if (removedWeeks.length) await db.week.deleteMany({ where: { id: { in: removedWeeks } } })

  // Rebuild supersets: clear this program's groups, then let applyGroupPayload
  // re-create and re-link them (it matches week/day/exercise the same way).
  const days = await db.workoutDay.findMany({ where: { week: { programId } }, select: { id: true } })
  if (days.length) await db.workoutGroup.deleteMany({ where: { dayId: { in: days.map((d) => d.id) } } })
  await applyGroupPayload(programId, payloadWeeks)
}
