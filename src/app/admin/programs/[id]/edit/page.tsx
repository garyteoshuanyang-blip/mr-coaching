"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import ProgramBuilder, { type BuilderWeek } from "@/components/ProgramBuilder"
import { getUser, authFetch } from "@/lib/client-auth"

/** Map the API's program shape into the builder's working shape. */
function toBuilderWeeks(weeks: any[]): BuilderWeek[] {
  return (weeks || []).map((w: any) => ({
    weekNumber: w.weekNumber,
    name: w.name ?? `Week ${w.weekNumber}`,
    days: (w.days || []).map((d: any) => ({
      dayName: d.dayName,
      dayOrder: d.dayOrder,
      // group key = the DB WorkoutGroup id, so exercises can reference it
      groups: (d.groups || []).map((g: any) => ({ key: g.id, restAfterSec: g.restAfterSec ?? 90 })),
      exercises: (d.exercises || []).map((e: any) => ({
        rowId: e.id,
        groupKey: e.groupId ?? null,
        exerciseId: e.exerciseId,
        exerciseName: e.exercise?.name ?? "",
        muscleGroup: e.exercise?.muscleGroup ?? "",
        sets: e.sets,
        reps: e.reps,
        weight: e.weight ?? "",
        restSec: e.restSec ?? 60,
        rpe: e.rpe ?? "",
        notes: e.notes ?? "",
        sortOrder: e.sortOrder,
      })),
    })),
  }))
}

export default function EditProgramPage() {
  const params = useParams()
  const [initial, setInitial] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!getUser()) { window.location.href = "/admin/login"; return }
    authFetch(`/api/programs/${params.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then((d) => setInitial({
        name: d.name ?? "",
        description: d.description ?? "",
        weeks: toBuilderWeeks(d.weeks),
      }))
      .catch((e) => setError(`Could not load program (${e})`))
  }, [params.id])

  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-red-500 text-sm">{error}</p></div>
  if (!initial) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>

  // ProgramBuilder is mounted only once data is loaded, so its week state
  // initialises from the existing program (never from an empty template).
  return <ProgramBuilder programId={String(params.id)} initial={initial} heading="Edit Program" />
}
