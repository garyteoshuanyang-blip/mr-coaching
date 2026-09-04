import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  const s = await auth()
  if (!s?.user || s.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const clientId = new URL(req.url).searchParams.get("clientId")
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 })

  const logs = await db.workoutLog.findMany({ where: { clientId, completed: true }, include: { workoutExercise: { include: { exercise: true, day: { include: { week: { include: { program: true } } } } } } }, orderBy: { date: "desc" } })

  const byEx: Record<string, any> = {}
  for (const log of logs) {
    const exId = log.workoutExercise.exerciseId
    if (!byEx[exId]) byEx[exId] = { exerciseName: log.workoutExercise.exercise.name, programName: log.workoutExercise.day.week.program.name, recentWeights: [], days: [] }
    if (log.loggedSets) { try { const sets = JSON.parse(log.loggedSets); const max = Math.max(...sets.map((s: any) => s.weight || 0)); if (max > 0) { byEx[exId].recentWeights.push(max); byEx[exId].days.push(log.date.toISOString().split("T")[0]) } } catch {} }
  }

  const suggestions: any[] = []
  for (const [, data] of Object.entries(byEx)) {
    const weights = (data as any).recentWeights.slice(0, 10)
    if (weights.length >= 3) {
      const latest = weights[0]; const count = weights.filter((w: number) => w === latest).length
      if (count >= 3) { suggestions.push({ exerciseName: (data as any).exerciseName, programName: (data as any).programName, currentWeight: latest, suggestedIncrease: Math.max(Math.round(latest * 0.05 * 2) / 2, 1.25), weeksAtWeight: Math.round(((new Date((data as any).days[0]).getTime() - new Date((data as any).days[(data as any).days.length - 1]).getTime()) / (7 * 24 * 60 * 60 * 1000)) || 1) }) }
    }
  }
  return NextResponse.json({ suggestions })
}