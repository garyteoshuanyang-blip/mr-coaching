import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user || (user.role !== "admin" && user.id !== id)) return unauth()

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // 1. Body weight logs (last 90 days)
  const bodyWeightLogs = await db.bodyWeightLog.findMany({
    where: { clientId: id, date: { gte: new Date(today.getTime() - 90 * 86400000) } },
    orderBy: { date: "asc" },
  })

  // 2. All workout logs for this client
  const workoutLogs = await db.workoutLog.findMany({
    where: { clientId: id },
    include: {
      workoutExercise: {
        include: { exercise: true, day: { include: { week: { include: { program: true } } } } },
      },
    },
    orderBy: { date: "asc" },
  })

  // 3. Compute week-over-week comparison
  // This week = last 7 days, Last week = 7-14 days ago
  const weekAgo = new Date(today.getTime() - 7 * 86400000)
  const twoWeeksAgo = new Date(today.getTime() - 14 * 86400000)

  const thisWeekLogs = workoutLogs.filter(l => {
    const d = new Date(l.date)
    return d >= weekAgo && d <= today
  })
  const lastWeekLogs = workoutLogs.filter(l => {
    const d = new Date(l.date)
    return d >= twoWeeksAgo && d < weekAgo
  })

  const calcVolume = (logs: typeof workoutLogs) => {
    let total = 0; let sessions = new Set<string>(); let exercises = new Set<string>()
    for (const l of logs) {
      if (l.completed && l.loggedSets) {
        try {
          const sets = JSON.parse(l.loggedSets)
          for (const s of sets) {
            if (s.weight && s.reps) total += s.weight * s.reps
          }
          sessions.add(l.date.toISOString().split("T")[0] + "-" + l.workoutExercise.dayId)
          exercises.add(l.workoutExercise.exercise.name)
        } catch {}
      }
    }
    return { totalVolume: total, sessionCount: sessions.size, exerciseCount: exercises.size }
  }

  const thisWeek = calcVolume(thisWeekLogs)
  const lastWeek = calcVolume(lastWeekLogs)
  const changePct = lastWeek.totalVolume > 0
    ? Math.round(((thisWeek.totalVolume - lastWeek.totalVolume) / lastWeek.totalVolume) * 100 * 10) / 10
    : thisWeek.totalVolume > 0 ? 100 : 0

  // 4. Per-exercise weight trends (last 30 days)
  const exerciseTrends: Record<string, { date: string; avgWeight: number; maxWeight: number; volume: number }[]> = {}
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000)

  for (const l of workoutLogs) {
    if (!l.completed || !l.loggedSets) continue
    const exName = l.workoutExercise.exercise.name
    const dateKey = new Date(l.date).toISOString().split("T")[0]
    try {
      const sets = JSON.parse(l.loggedSets)
      const weights = sets.filter((s: any) => s.weight).map((s: any) => s.weight)
      if (weights.length === 0) continue
      const avgW = weights.reduce((a: number, w: number) => a + w, 0) / weights.length
      const maxW = Math.max(...weights)
      const vol = sets.reduce((a: number, s: any) => a + (s.weight || 0) * (s.reps || 0), 0)
      if (!exerciseTrends[exName]) exerciseTrends[exName] = []
      exerciseTrends[exName].push({ date: dateKey, avgWeight: Math.round(avgW * 10) / 10, maxWeight: maxW, volume: vol })
    } catch {}
  }

  // Sort each trend by date
  for (const key of Object.keys(exerciseTrends)) {
    exerciseTrends[key].sort((a, b) => a.date.localeCompare(b.date))
  }

  // 5. Per-exercise latest vs previous weight
  const exerciseComparison: { name: string; latest: number | null; previous: number | null; changePct: number | null }[] = []
  for (const [name, entries] of Object.entries(exerciseTrends)) {
    const latest = entries[entries.length - 1]?.avgWeight ?? null
    const previous = entries.length >= 2 ? entries[entries.length - 2]?.avgWeight ?? null : null
    const change = latest && previous ? Math.round(((latest - previous) / previous) * 100 * 10) / 10 : null
    exerciseComparison.push({ name, latest, previous, changePct: change })
  }

  return NextResponse.json({
    bodyWeight: bodyWeightLogs.map(l => ({ date: l.date.toISOString().split("T")[0], weight: l.weight })),
    weekComparison: {
      thisWeek: { ...thisWeek, label: "This week" },
      lastWeek: { ...lastWeek, label: "Last week" },
      changePct,
    },
    exerciseTrends,
    exerciseComparison: exerciseComparison.sort((a, b) => (b.latest || 0) - (a.latest || 0)),
  })
}
