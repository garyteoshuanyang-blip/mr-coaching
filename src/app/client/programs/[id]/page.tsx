"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Clock, Dumbbell } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

export default function ClientProgramDetailPage() {
  const params = useParams()
  const [program, setProgram] = useState<any>(null); const [loading, setLoading] = useState(true)
  const [loggingDay, setLoggingDay] = useState<string | null>(null)
  const [setsData, setSetsData] = useState<Record<string, any[]>>({})
  const [saving, setSaving] = useState(false)
  const [showPast, setShowPast] = useState(false)

  useEffect(() => {
    if (!getUser()) window.location.href = "/client/access"
    authFetch(`/api/programs/${params.id}`).then(r => r.json()).then(data => {
      setProgram(data)
      const initial: Record<string, any[]> = {}
      if (data.weeks) {
        for (const w of data.weeks) {
          if (w.days) {
            for (const d of w.days) {
              if (d.exercises) {
                for (const ex of d.exercises) {
                  const latestLog = ex.logs?.find((l: any) => l.completed)
                  if (latestLog?.loggedSets) initial[ex.id] = JSON.parse(latestLog.loggedSets)
                }
              }
            }
          }
        }
      }
      setSetsData(initial)
      setLoading(false)
    })
  }, [params.id])

  const selectDay = (dayId: string) => {
    setLoggingDay(dayId)
    if (!program) return
    const day = program.weeks.flatMap((w: any) => w.days).find((d: any) => d.id === dayId)
    if (!day) return
    const newSets: Record<string, any[]> = { ...setsData }
    day.exercises.forEach((ex: any) => {
      if (!newSets[ex.id]) {
        // Try loading any log (not just completed — partial saves count)
        const latestLog = ex.logs?.slice().reverse().find((l: any) => l.loggedSets)
        if (latestLog?.loggedSets) {
          try { newSets[ex.id] = JSON.parse(latestLog.loggedSets) } catch {}
        }
      }
      if (!newSets[ex.id]) {
        // Fall back to prescribed weight if set, otherwise start at 0
        const prescribedWeight = parseFloat(ex.weight) || 0
        newSets[ex.id] = Array.from({ length: ex.sets }, (_, i) => ({
          set: i + 1,
          reps: parseInt(ex.reps) || 10,
          weight: prescribedWeight,
        }))
      }
    })
    setSetsData(newSets)
  }

  const updateSet = (exerciseId: string, setIdx: number, field: string, value: number | undefined) => {
    const newSets = { ...setsData }; const exerciseSets = [...(newSets[exerciseId] || [])]; exerciseSets[setIdx] = { ...exerciseSets[setIdx], [field]: value }; newSets[exerciseId] = exerciseSets; setSetsData(newSets)
  }

  const completeWorkout = async () => {
    if (!loggingDay || !program) return; setSaving(true)
    const day = program.weeks.flatMap((w: any) => w.days).find((d: any) => d.id === loggingDay)
    if (!day) return; const today = new Date().toISOString().split("T")[0]
    for (const ex of day.exercises) {
      const logged = setsData[ex.id]
      if (!logged) continue
      await authFetch("/api/workout-logs", { method: "POST", body: JSON.stringify({ workoutExerciseId: ex.id, date: today, loggedSets: JSON.stringify(logged), completed: true }) })
    }
    setSaving(false); setLoggingDay(null); window.location.reload()
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>
  if (!program) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Not found</p></div>

  const totalWeeks = program.weeks?.length || 0
  const completedDays = program.weeks?.flatMap((w: any) => w.days)?.filter((d: any) => d.exercises?.length > 0 && d.exercises.every((ex: any) => ex.logs?.some((l: any) => l.completed)))?.length || 0
  const totalDays = program.weeks?.flatMap((w: any) => w.days)?.filter((d: any) => d.exercises?.length > 0)?.length || 0
  const progressPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href="/client/programs" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">{program.name}</h1></div></header>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Progress bar */}
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">{completedDays} of {totalDays} days done</span>
            <span className="text-xs text-gray-400">{progressPct}% · {totalWeeks} weeks</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex bg-white rounded-xl border overflow-hidden">
          <button onClick={() => setShowPast(false)}
            className={`flex-1 py-2.5 text-sm font-medium text-center ${!showPast ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>Schedule</button>
          <button onClick={() => setShowPast(true)}
            className={`flex-1 py-2.5 text-sm font-medium text-center ${showPast ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}}`}>Past Workouts</button>
        </div>

        {showPast ? (
          <div className="space-y-2">
            {program.weeks.flatMap((w: any) => w.days).filter((d: any) => d.exercises?.some((ex: any) => ex.logs?.some((l: any) => l.completed))).length === 0 ? (
              <div className="text-center py-8 bg-white rounded-xl border"><p className="text-sm text-gray-400">No completed workouts yet.</p></div>
            ) : program.weeks.map((week: any) => {
              const completedDays = week.days.filter((d: any) => d.exercises?.some((ex: any) => ex.logs?.some((l: any) => l.completed)))
              if (completedDays.length === 0) return null
              return (
                <div key={week.id} className="bg-white rounded-xl border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b"><p className="font-medium text-sm">{week.name}</p></div>
                  <div className="p-4 space-y-3">
                    {completedDays.map((day: any) => {
                      const logsByDate = new Map<string, any[]>()
                      day.exercises.forEach((ex: any) => {
                        const logs = ex.logs?.filter((l: any) => l.completed && l.loggedSets) || []
                        logs.forEach((l: any) => {
                          const dateKey = new Date(l.date).toLocaleDateString("en-SG", { day: "numeric", month: "short" })
                          if (!logsByDate.has(dateKey)) logsByDate.set(dateKey, [])
                          logsByDate.get(dateKey)!.push({ exercise: ex, log: l })
                        })
                      })
                      return Array.from(logsByDate.entries()).map(([dateKey, entries]) => (
                        <div key={`${day.id}-${dateKey}`} className="border rounded-lg p-3">
                          <div className="flex items-center gap-1.5 mb-2"><Clock size={14} className="text-gray-400"/><p className="text-xs text-gray-500 font-medium">{day.dayName} · {dateKey}</p></div>
                          {entries.map(({ exercise, log }, ei) => {
                            const parsed = (() => { try { return JSON.parse(log.loggedSets) } catch { return null } })()
                            if (!parsed) return null
                            const avgWeight = parsed.filter((s: any) => s.weight).reduce((a: number, s: any) => a + s.weight, 0) / (parsed.filter((s: any) => s.weight).length || 1)
                            return (
                              <div key={ei} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-1 last:mb-0">
                                <p className="text-sm">{exercise.exercise.name} <span className="text-xs text-gray-400">({exercise.sets}×{exercise.reps})</span></p>
                                <span className="text-xs font-medium text-blue-600">{avgWeight > 0 ? `${Math.round(avgWeight)}kg` : ""}</span>
                              </div>
                            )
                          })}
                        </div>
                      ))
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Schedule view */
          program.weeks.map((week: any) => (
          <div key={week.id} className="bg-white rounded-xl border overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b"><p className="font-medium text-sm">{week.name}</p></div>
            <div className="p-4 space-y-3">
              {week.days.map((day: any) => {
                            const allCompleted = day.exercises.length > 0 && day.exercises.every((ex: any) => ex.logs?.some((l: any) => l.completed))
                            return (
                              <div key={day.id} className={`border rounded-lg p-3 ${loggingDay === day.id ? 'border-blue-300 bg-blue-50/30' : ''}`}>
                                <button onClick={() => { const nid = day.id === loggingDay ? null : day.id; setLoggingDay(nid); if (nid) selectDay(nid); }} className="w-full flex items-center justify-between">
                                  <p className={`font-medium text-sm ${allCompleted ? 'text-green-700' : 'text-gray-700'} flex items-center gap-2`}>{day.dayName}{allCompleted && <CheckCircle size={14} className="text-green-500"/>}</p>
                                  <span className={`text-xs font-medium ${allCompleted ? 'text-green-600' : 'text-blue-600'}`}>{allCompleted ? "✓ Completed" : "Log →"}</span>
                                </button>

                                {/* Inline exercise preview (when not expanded) */}
                                {loggingDay !== day.id && day.exercises.length > 0 && !allCompleted && (
                                  <div className="mt-2 pt-2 border-t border-gray-100 space-y-1.5">
                                    {day.exercises.map((ex: any) => (
                                      <div key={ex.id} className="flex items-center justify-between text-xs">
                                        <span className="text-gray-600 truncate">{ex.exercise.name} <span className="text-gray-400">({ex.sets}×{ex.reps})</span></span>
                                        <div className="flex items-center gap-1 min-w-0">
                                          {ex.weight && <span className="text-blue-500 font-medium whitespace-nowrap">@{ex.weight}</span>}
                                          <Dumbbell size={12} className="text-gray-300 shrink-0"/>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {loggingDay === day.id && (
                                  <div className="mt-3 space-y-4">
                                    {day.exercises.map((ex: any) => (
                                      <div key={ex.id} className="bg-white rounded-lg p-3 border">
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="font-medium text-sm">{ex.exercise.name} <span className="text-xs text-gray-400">({ex.sets}×{ex.reps})</span></p>
                                          <span className="text-xs text-gray-400 capitalize">{ex.exercise.muscleGroup}</span>
                                        </div>
                                        {(()=>{try{const l=[...(ex.logs||[])].find((l:any)=>l.completed&&l.loggedSets);if(!l)return null;const p=JSON.parse(l.loggedSets).filter((s:any)=>s.weight).map((s:any)=>s.weight);if(!p.length)return null;return <p className="text-xs text-amber-600 mb-2">Last: {p[p.length-1]}kg</p>}catch{return null}})()}
                                        <div className="space-y-1.5">{(setsData[ex.id] || []).map((set: any, si: number) => (
                                          <div key={si} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1.5">
                                            <span className="w-5 text-gray-400 font-medium">S{si + 1}</span>
                                            <div className="flex-1 flex items-center gap-1">
                                              <input type="number" value={set.reps || ""} onChange={e => updateSet(ex.id, si, "reps", parseInt(e.target.value) || 0)} className="w-12 px-1 py-1 border rounded text-center text-xs" placeholder="Reps" min={0} />
                                              <span className="text-gray-400">×</span>
                                              <input type="number" value={set.weight || ""} onChange={e => updateSet(ex.id, si, "weight", parseFloat(e.target.value) || 0)} className="w-16 px-1 py-1 border rounded text-center text-xs font-medium" placeholder="kg" min={0} step={0.5} />
                                              <span className="text-gray-400 text-xs">kg</span>
                                            </div>
                                            <input type="number" value={set.rpe || ""} onChange={e => updateSet(ex.id, si, "rpe", parseInt(e.target.value) || undefined)} className="w-10 px-1 py-1 border rounded text-center text-xs" placeholder="RPE" min={1} max={10} />
                                          </div>
                                        ))}</div>
                                      </div>
                                    ))}
                                    <button onClick={completeWorkout} disabled={saving} className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">{saving ? "Saving..." : "✓ Complete Workout"}</button>
                                    <button onClick={() => setLoggingDay(null)} className="w-full text-sm text-gray-400 py-1.5 hover:text-gray-600">Close</button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
            </div>
          </div>
        )))}
      </div>
    </div>
  )
}