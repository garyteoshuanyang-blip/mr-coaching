"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Save, X, Copy, Check, Link2 } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"
import { groupLabel } from "@/lib/group-label"

let uidSeq = 0
const uid = () => `r${Date.now().toString(36)}${(++uidSeq).toString(36)}`

const REST_OPTIONS = [
  { v: 30, l: "30s" }, { v: 60, l: "60s" }, { v: 90, l: "90s" },
  { v: 120, l: "2m" }, { v: 180, l: "3m" },
]

const emptyDay = (n: number) => ({ dayName: `Day ${n}`, dayOrder: n, groups: [] as any[], exercises: [] as any[] })

export type BuilderWeek = { weekNumber: number; name: string; days: any[] }

export default function ProgramBuilder({
  programId,
  clientId,
  initial,
  heading,
}: {
  programId?: string
  clientId?: string | null
  initial?: { name: string; description?: string | null; weeks: BuilderWeek[] }
  heading: string
}) {
  const router = useRouter()
  const isEdit = !!programId
  const [name, setName] = useState(initial?.name ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  // Weeks initialised ONCE from props — never re-initialised by the duration control.
  const [weeks, setWeeks] = useState<BuilderWeek[]>(
    () => initial?.weeks?.length ? initial.weeks : [{ weekNumber: 1, name: "Week 1", days: [emptyDay(1)] }]
  )
  const [duration, setDuration] = useState(initial?.weeks?.length ?? 1)
  const [exercises, setExercises] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState<{ wi: number; di: number } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEx, setSelectedEx] = useState<Set<string>>(new Set())
  const [showNewExercise, setShowNewExercise] = useState(false)
  const [newExName, setNewExName] = useState("")
  const [newExGroup, setNewExGroup] = useState("Chest")
  const [newExEquipment, setNewExEquipment] = useState("")
  const [creatingEx, setCreatingEx] = useState(false)
  const [exSel, setExSel] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!getUser()) window.location.href = "/admin/login"
    authFetch("/api/exercises").then(r => r.json()).then(d => setExercises(d.exercises || []))
  }, [])

  const makeWeek = (n: number) => ({ weekNumber: n, name: `Week ${n}`, days: [emptyDay(1)] })

  /** Non-destructive duration change: keeps existing weeks, appends/trims only. */
  const handleDurationChange = (n: number) => {
    setDuration(n)
    setWeeks(prev => {
      if (n > prev.length) {
        return [...prev, ...Array.from({ length: n - prev.length }, (_, i) => makeWeek(prev.length + i + 1))]
      }
      return prev.slice(0, n)
    })
  }

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()) || e.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()))

  const addWeek = () => { const n = weeks.length + 1; setWeeks([...weeks, { weekNumber: n, name: `Week ${n}`, days: [emptyDay(1)] }]); setDuration(n) }
  const removeWeek = (i: number) => { const next = weeks.filter((_, idx) => idx !== i).map((w, idx) => ({ ...w, weekNumber: idx + 1, name: w.name || `Week ${idx + 1}` })); setWeeks(next); setDuration(next.length) }

  const copyWeek = (i: number) => {
    const w = JSON.parse(JSON.stringify(weeks[i]))
    const newWeeks = [...weeks]
    w.weekNumber = weeks.length + 1
    w.name = `Week ${weeks.length + 1}`
    newWeeks.push(w)
    setWeeks(newWeeks)
    setDuration(newWeeks.length)
  }

  const fillFromWeek1 = () => {
    if (weeks.length < 2 || !weeks[0].days.length) return
    const w1 = JSON.parse(JSON.stringify(weeks[0]))
    const newWeeks = weeks.map((week, i) => {
      if (i === 0) return week
      return { ...week, days: JSON.parse(JSON.stringify(w1.days)) }
    })
    setWeeks(newWeeks)
  }

  const addDay = (wi: number) => { const w = [...weeks]; const o = w[wi].days.length + 1; w[wi].days.push(emptyDay(o)); setWeeks(w) }
  const removeDay = (wi: number, di: number) => { const w = [...weeks]; w[wi].days = w[wi].days.filter((_, i) => i !== di).map((d, i) => ({ ...d, dayOrder: i + 1 })); setWeeks(w); setExSel(new Set()) }

  const mkEx = (ex: any) => ({ rowId: uid(), groupKey: null as string | null, exerciseId: ex.id, exerciseName: ex.name, muscleGroup: ex.muscleGroup, sets: 3, reps: "10", weight: "", restSec: 60, rpe: "", notes: "", sortOrder: 1 })

  const addSelectedExercises = () => {
    if (!picker || selectedEx.size === 0) return
    const w = [...weeks]; const d = w[picker.wi].days[picker.di]
    const rows = [...d.exercises]
    exercises.filter(e => selectedEx.has(e.id)).forEach(ex => {
      if (!rows.find((x: any) => x.exerciseId === ex.id)) {
        const row = mkEx(ex); row.sortOrder = rows.length + 1
        rows.push(row)
      }
    })
    w[picker.wi].days[picker.di].exercises = rows
    setWeeks(w)
    setSelectedEx(new Set()); setPicker(null); setSearchTerm(""); setExSel(new Set())
  }

  const removeEx = (wi: number, di: number, ei: number) => {
    const w = [...weeks]; const d = w[wi].days[di]
    const removed = d.exercises[ei]
    let exs = d.exercises.filter((_: any, i: number) => i !== ei).map((e: any, i: number) => ({ ...e, sortOrder: i + 1 }))
    let gs = d.groups || []
    if (removed?.groupKey) {
      const left = exs.filter((e: any) => e.groupKey === removed.groupKey).length
      if (left < 2) {
        exs = exs.map((e: any) => e.groupKey === removed.groupKey ? { ...e, groupKey: null } : e)
        gs = gs.filter((g: any) => g.key !== removed.groupKey)
      }
    }
    d.exercises = exs; d.groups = gs
    setWeeks(w); setExSel(new Set())
  }

  const updEx = (wi: number, di: number, ei: number, f: string, v: any) => { const w = [...weeks]; (w[wi].days[di].exercises[ei] as any)[f] = v; setWeeks(w) }

  const toggleExSel = (wi: number, di: number, rowId: string) => {
    const k = `${wi}-${di}-${rowId}`
    const next = new Set(exSel)
    if (next.has(k)) next.delete(k); else next.add(k)
    setExSel(next)
  }

  const linkSelected = (wi: number, di: number) => {
    const w = [...weeks]; const d = w[wi].days[di]
    const ids = d.exercises.filter((e: any) => exSel.has(`${wi}-${di}-${e.rowId}`)).map((e: any) => e.rowId)
    if (ids.length !== 2) { alert("Tick exactly 2 exercises to link them as a superset."); return }
    const key = uid()
    const moving = d.exercises.filter((e: any) => ids.includes(e.rowId)).map((e: any) => ({ ...e, groupKey: key }))
    const firstIdx = d.exercises.findIndex((e: any) => e.rowId === ids[0])
    const rest = d.exercises.filter((e: any) => !ids.includes(e.rowId))
    const insertAt = d.exercises.slice(0, firstIdx).filter((e: any) => !ids.includes(e.rowId)).length
    const ordered = [...rest.slice(0, insertAt), ...moving, ...rest.slice(insertAt)].map((e: any, i: number) => ({ ...e, sortOrder: i + 1 }))
    d.exercises = ordered
    d.groups = [...(d.groups || []), { key, restAfterSec: 90 }]
    setWeeks(w); setExSel(new Set())
  }

  const unlinkGroup = (wi: number, di: number, key: string) => {
    const w = [...weeks]; const d = w[wi].days[di]
    d.exercises = d.exercises.map((e: any) => e.groupKey === key ? { ...e, groupKey: null } : e)
    d.groups = (d.groups || []).filter((g: any) => g.key !== key)
    setWeeks(w); setExSel(new Set())
  }

  const setGroupRest = (wi: number, di: number, key: string, v: number) => {
    const w = [...weeks]; const d = w[wi].days[di]
    d.groups = (d.groups || []).map((g: any) => g.key === key ? { ...g, restAfterSec: v } : g)
    setWeeks(w)
  }

  const buildPayloadWeeks = (wks: any[]) => wks.map((w: any) => ({
    weekNumber: w.weekNumber,
    name: w.name,
    days: (w.days || []).map((d: any) => {
      const orderedKeys: string[] = []
      ;(d.exercises || []).forEach((e: any) => { if (e.groupKey && !orderedKeys.includes(e.groupKey)) orderedKeys.push(e.groupKey) })
      const keyToLabel = new Map<string, string>()
      orderedKeys.forEach((k, i) => keyToLabel.set(k, groupLabel(i)))
      return {
        dayName: d.dayName,
        dayOrder: d.dayOrder,
        groups: orderedKeys.map((k) => ({
          label: keyToLabel.get(k),
          restAfterSec: (d.groups || []).find((g: any) => g.key === k)?.restAfterSec ?? 90,
        })),
        exercises: (d.exercises || []).map((e: any, i: number) => ({
          exerciseId: e.exerciseId, sortOrder: i + 1, sets: e.sets, reps: e.reps,
          weight: e.weight, restSec: e.restSec, rpe: e.rpe, notes: e.notes,
          groupLabel: e.groupKey ? keyToLabel.get(e.groupKey) : null,
        })),
      }
    }),
  }))

  const handleSubmit = async (e: React.FormEvent, confirmDeleteLogs = false) => {
    e.preventDefault(); setSaving(true)
    // Auto-fill Week 1 → other weeks ONLY when creating.
    // In edit mode this would overwrite weeks the coach has already customised.
    let raw = weeks
    if (!isEdit) {
      const fill = weeks.length > 1 && weeks[0].days.some(d => d.exercises.length > 0)
      if (fill) raw = weeks.map((w, i) => i === 0 ? w : { ...w, days: JSON.parse(JSON.stringify(weeks[0].days)) })
    }
    const wkData = buildPayloadWeeks(raw)

    const res = isEdit
      ? await authFetch(`/api/programs/${programId}`, {
          method: "PUT",
          body: JSON.stringify({ name, description: description || null, weeks: wkData, confirmDeleteLogs }),
        })
      : await authFetch("/api/programs", {
          method: "POST",
          body: JSON.stringify({ name, description: description || null, weeks: wkData }),
        })

    if (res.status === 409) {
      // Server refused: this edit would delete logged history
      const info = await res.json().catch(() => ({}))
      const ok = confirm(
        `⚠️ This edit will delete ${info.logsToDelete ?? "some"} logged workout record(s).\n\n` +
        `They belong to exercises/day(s) you are removing or moving.\n\nSave anyway?`
      )
      if (!ok) { setSaving(false); return }
      return handleSubmit(e, true)
    }

    if (!res.ok) { alert(isEdit ? "Failed to save" : "Failed"); setSaving(false); return }
    const d = await res.json()

    if (isEdit) {
      router.push(`/admin/programs/${programId}`)
      return
    }
    const programId2 = d.program.id
    if (clientId) {
      const assignRes = await authFetch("/api/programs/assign", { method: "POST", body: JSON.stringify({ programId: programId2, clientId }) })
      if (!assignRes.ok) { alert("Program created but NOT assigned — check client page"); setSaving(false); return }
      router.push(`/admin/clients/${clientId}`)
    } else {
      router.push(`/admin/programs/${programId2}`)
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedEx)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedEx(next)
  }

  const handleCreateExercise = async () => {
    if (!newExName.trim()) return
    setCreatingEx(true)
    const res = await authFetch("/api/exercises", {
      method: "POST",
      body: JSON.stringify({ name: newExName.trim(), muscleGroup: newExGroup, equipment: newExEquipment || null, description: null })
    })
    if (res.ok) {
      const data = await res.json()
      const newEx = data.exercise
      setExercises(prev => [...prev, newEx].sort((a, b) => a.name.localeCompare(b.name)))
      const nextSel = new Set(selectedEx)
      nextSel.add(newEx.id)
      setSelectedEx(nextSel)
      setShowNewExercise(false); setNewExName(""); setNewExGroup("Chest"); setNewExEquipment("")
    } else {
      alert("Failed to create exercise")
    }
    setCreatingEx(false)
  }

  const exCard = (wi: number, di: number, ei: number, ex: any, tag: string | null) => {
    const selKey = `${wi}-${di}-${ex.rowId}`
    const linkable = !ex.groupKey
    return (
      <div key={ex.rowId} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
        {linkable && (
          <button type="button" onClick={() => toggleExSel(wi, di, ex.rowId)} aria-label="Select for superset"
            className={`mt-1 w-4 h-4 shrink-0 rounded border flex items-center justify-center ${exSel.has(selKey) ? "bg-purple-600 border-purple-600" : "border-gray-300 bg-white"}`}>
            {exSel.has(selKey) && <Check size={11} className="text-white" />}
          </button>
        )}
        <div className="flex-1 space-y-1">
          <p className="font-medium text-sm">
            {tag && <span className="text-purple-700 font-semibold mr-1">{tag}</span>}
            {ex.exerciseName} <span className="text-xs text-gray-400">({ex.muscleGroup})</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <div><label className="text-xs text-gray-500">Sets</label><input type="number" value={ex.sets} onChange={e => updEx(wi, di, ei, "sets", parseInt(e.target.value) || 1)} className="w-12 px-1 py-0.5 border rounded text-xs text-center" min={1} /></div>
            <div><label className="text-xs text-gray-500">Reps</label><input type="text" value={ex.reps} onChange={e => updEx(wi, di, ei, "reps", e.target.value)} className="w-14 px-1 py-0.5 border rounded text-xs text-center" /></div>
            <div><label className="text-xs text-gray-500">Weight</label><input type="text" value={ex.weight || ""} onChange={e => updEx(wi, di, ei, "weight", e.target.value)} className="w-16 px-1 py-0.5 border rounded text-xs text-center" placeholder="kg" /></div>
            {!ex.groupKey && (
              <div><label className="text-xs text-gray-500">Rest</label><select value={ex.restSec} onChange={e => updEx(wi, di, ei, "restSec", parseInt(e.target.value))} className="w-16 px-1 py-0.5 border rounded text-xs">{REST_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
            )}
            <div><label className="text-xs text-gray-500">RPE</label><input type="text" value={ex.rpe} onChange={e => updEx(wi, di, ei, "rpe", e.target.value)} className="w-12 px-1 py-0.5 border rounded text-xs text-center" /></div>
          </div>
          <input type="text" value={ex.notes} onChange={e => updEx(wi, di, ei, "notes", e.target.value)} className="w-full text-xs text-gray-500 bg-transparent p-0" placeholder="Notes" />
        </div>
        <button type="button" onClick={() => removeEx(wi, di, ei)} className="text-red-300 hover:text-red-500"><X size={14} /></button>
      </div>
    )
  }

  const dayExercises = (wi: number, di: number, day: any) => {
    const out: any[] = []
    const seen = new Set<string>()
    day.exercises.forEach((ex: any, ei: number) => {
      if (ex.groupKey) {
        if (seen.has(ex.groupKey)) return
        seen.add(ex.groupKey)
        const gi = (day.groups || []).findIndex((g: any) => g.key === ex.groupKey)
        const label = groupLabel(gi < 0 ? 0 : gi)
        const members = day.exercises.map((e: any, i: number) => ({ e, i })).filter(({ e }: any) => e.groupKey === ex.groupKey)
        out.push(
          <div key={ex.groupKey} className="rounded-lg border-2 border-purple-200 bg-purple-50/50 p-2">
            <div className="flex items-center justify-between gap-2 flex-wrap px-1 pb-2">
              <span className="text-xs font-semibold text-purple-700">Superset {label}</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Rest after round</label>
                <select value={(day.groups || [])[gi]?.restAfterSec ?? 90} onChange={e => setGroupRest(wi, di, ex.groupKey, parseInt(e.target.value))} className="w-16 px-1 py-0.5 border rounded text-xs">
                  {REST_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
                <button type="button" onClick={() => unlinkGroup(wi, di, ex.groupKey)} className="text-xs text-red-500 hover:text-red-700">Unlink</button>
              </div>
            </div>
            <div className="space-y-2">
              {members.map(({ e, i }: any, mi: number) => exCard(wi, di, i, e, `${label}${mi + 1}`))}
            </div>
          </div>
        )
      } else {
        out.push(exCard(wi, di, ei, ex, null))
      }
    })
    return out
  }

  const selCountForDay = (wi: number, di: number) => {
    const d = weeks[wi].days[di]
    return d.exercises.filter((e: any) => exSel.has(`${wi}-${di}-${e.rowId}`)).length
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-4">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href={isEdit ? `/admin/programs/${programId}` : (clientId ? `/admin/clients/${clientId}` : "/admin/programs")} className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500" /></Link><h1 className="font-semibold">{heading}</h1></div></header>
      <form onSubmit={(e) => handleSubmit(e)} className="p-4 max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          <div>
            <label className="block text-sm font-medium mb-2">Duration</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <button key={n} type="button" onClick={() => handleDurationChange(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${duration === n ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{n}</button>
              ))}
              <span className="text-xs text-gray-400 self-center ml-1">weeks</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isEdit ? "Adding/removing weeks keeps your existing content." : "Sets the number of weeks to build."}
            </p>
          </div>
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
              <input type="text" value={week.name} onChange={e => { const w = [...weeks]; w[wi].name = e.target.value; setWeeks(w) }} className="font-medium text-sm bg-transparent p-0 focus:outline-none" />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => copyWeek(wi)} className="text-blue-400 hover:text-blue-600 text-xs flex items-center gap-0.5"><Copy size={12} /> Copy</button>
                {weeks.length > 1 && <button type="button" onClick={() => removeWeek(wi)} className="text-red-400 text-xs">Remove</button>}
              </div>
            </div>
            <div className="p-4 space-y-3">
              {week.days.map((day: any, di: number) => (
                <div key={di} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <input type="text" value={day.dayName} onChange={e => { const w = [...weeks]; w[wi].days[di].dayName = e.target.value; setWeeks(w) }} className="font-medium text-sm bg-transparent p-0" />
                    {week.days.length > 1 && <button type="button" onClick={() => removeDay(wi, di)} className="text-red-400 text-xs">Remove</button>}
                  </div>
                  <div className="space-y-2">
                    {dayExercises(wi, di, day)}
                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      <button type="button" onClick={() => { setPicker({ wi, di }); setSelectedEx(new Set()); setSearchTerm(""); setShowNewExercise(false) }} className="text-sm text-blue-600 hover:text-blue-700"><Plus size={14} /> Add exercise</button>
                      <button type="button" disabled={selCountForDay(wi, di) !== 2} onClick={() => linkSelected(wi, di)}
                        className="text-sm text-purple-600 hover:text-purple-800 disabled:text-gray-300 disabled:cursor-default flex items-center gap-1">
                        <Link2 size={14} /> Link as superset{selCountForDay(wi, di) > 0 ? ` (${selCountForDay(wi, di)})` : ""}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addDay(wi)} className="text-sm text-gray-500"><Plus size={14} /> Add day</button>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <button type="button" onClick={addWeek} className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400">+ Add Week</button>
          <button type="button" onClick={fillFromWeek1} className="flex-1 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl text-sm hover:border-blue-400 hover:bg-blue-50">
            ↻ Fill Weeks from Week 1
          </button>
        </div>
        <button type="submit" disabled={saving || !name} className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"><Save size={18} /> {saving ? (isEdit ? "Saving..." : "Creating...") : (isEdit ? "Save Changes" : "Create Program")}</button>
      </form>

      {picker && <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
          <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showNewExercise ? (
                <h3 className="font-medium text-sm">New Exercise</h3>
              ) : (
                <>
                  <h3 className="font-medium text-sm">Select Exercises</h3>
                  {selectedEx.size > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selectedEx.size} selected</span>}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!showNewExercise && (
                <button type="button" onClick={() => setShowNewExercise(true)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"><Plus size={12} /> New</button>
              )}
              <button onClick={() => setPicker(null)} className="text-gray-400"><X size={18} /></button>
            </div>
          </div>
          <div className="p-3 flex-1 overflow-auto">
            {showNewExercise ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exercise Name *</label>
                  <input type="text" value={newExName} onChange={e => setNewExName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Bulgarian Split Squat" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Muscle Group *</label>
                  <select value={newExGroup} onChange={e => setNewExGroup(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {["Chest", "Back", "Legs", "Shoulders", "Arms", "Core", "Cardio", "Full Body"].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Equipment (optional)</label>
                  <input type="text" value={newExEquipment} onChange={e => setNewExEquipment(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Barbell, Dumbbell" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => { setShowNewExercise(false); setNewExName(""); setNewExGroup("Chest"); setNewExEquipment("") }} className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-600">Back</button>
                  <button type="button" onClick={handleCreateExercise} disabled={creatingEx || !newExName.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                    {creatingEx ? "Creating..." : "Create & Add"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input type="text" placeholder="Search exercises..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mb-3" autoFocus />
                <div className="space-y-1">
                  {filtered.length === 0 ? <p className="text-sm text-gray-400 text-center py-4">No exercises. <button type="button" onClick={() => setShowNewExercise(true)} className="text-blue-600 hover:underline">Add one?</button></p>
                    : filtered.map(ex => (
                      <button key={ex.id} type="button" onClick={() => toggleSelect(ex.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between gap-2 ${selectedEx.has(ex.id) ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedEx.has(ex.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"}`}>
                            {selectedEx.has(ex.id) && <Check size={12} className="text-white" />}
                          </div>
                          <span className="font-medium">{ex.name}</span>
                        </div>
                        <span className="text-xs text-gray-400 capitalize">{ex.muscleGroup}</span>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
          <div className="sticky bottom-0 bg-white border-t px-4 py-3 flex gap-2">
            <button type="button" onClick={() => setPicker(null)} className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="button" onClick={addSelectedExercises} disabled={selectedEx.size === 0}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
              Add {selectedEx.size > 0 ? `(${selectedEx.size})` : ""} Selected
            </button>
          </div>
        </div>
      </div>}
    </div>
  )
}
