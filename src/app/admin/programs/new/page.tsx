"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Save, X, Copy, Check } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

function NewProgramForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get("clientId")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [weeks, setWeeks] = useState([{ weekNumber: 1, name: "Week 1", days: [{ dayName: "Day 1", dayOrder: 1, exercises: [] as any[] }] }])
  const [exercises, setExercises] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState<{wi:number;di:number}|null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEx, setSelectedEx] = useState<Set<string>>(new Set())
  const [duration, setDuration] = useState(1)
  const [showNewExercise, setShowNewExercise] = useState(false)
  const [newExName, setNewExName] = useState("")
  const [newExGroup, setNewExGroup] = useState("Chest")
  const [newExEquipment, setNewExEquipment] = useState("")
  const [creatingEx, setCreatingEx] = useState(false)

  useEffect(()=>{if (!getUser()) window.location.href = "/admin/login"; authFetch("/api/exercises").then(r=>r.json()).then(d=>setExercises(d.exercises||[]))},[])

  const makeWeek = (n: number) => ({ weekNumber: n, name: `Week ${n}`, days: [{ dayName: "Day 1", dayOrder: 1, exercises: [] as any[] }] })

  useEffect(() => {
    setWeeks(Array.from({ length: duration }, (_, i) => makeWeek(i + 1)))
  }, [duration])

  const filtered = exercises.filter(e=>e.name.toLowerCase().includes(searchTerm.toLowerCase())||e.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()))

  const addWeek = () => { const n = weeks.length+1; setWeeks([...weeks, {weekNumber:n, name:`Week ${n}`, days:[{dayName:"Day 1", dayOrder:1, exercises:[]}]}]) }
  const removeWeek = (i:number) => setWeeks(weeks.filter((_,idx)=>idx!==i).map((w,idx)=>({...w, weekNumber:idx+1})))

  const copyWeek = (i:number) => {
    const w = JSON.parse(JSON.stringify(weeks[i]))
    const newWeeks = [...weeks]
    w.weekNumber = weeks.length + 1
    w.name = `Week ${weeks.length + 1}`
    newWeeks.push(w)
    setWeeks(newWeeks)
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

  const addDay = (wi:number) => { const w=[...weeks]; const o=w[wi].days.length+1; w[wi].days.push({dayName:`Day ${o}`, dayOrder:o, exercises:[]}); setWeeks(w) }
  const removeDay = (wi:number, di:number) => { const w=[...weeks]; w[wi].days=w[wi].days.filter((_,i)=>i!==di).map((d,i)=>({...d,dayOrder:i+1})); setWeeks(w) }

  const addEx = (wi:number, di:number, ex:any) => {
    const w=[...weeks]; const d=w[wi].days[di]
    d.exercises.push({exerciseId:ex.id, exerciseName:ex.name, muscleGroup:ex.muscleGroup, sets:3, reps:"10", weight:"", restSec:60, rpe:"", notes:"", sortOrder:d.exercises.length+1})
    setWeeks(w)
  }

  const addSelectedExercises = () => {
    if (!picker || selectedEx.size === 0) return
    const w=[...weeks]; const d=w[picker.wi].days[picker.di]
    exercises.filter(e => selectedEx.has(e.id)).forEach(ex => {
      if (!d.exercises.find((x:any) => x.exerciseId === ex.id)) {
        d.exercises.push({exerciseId:ex.id, exerciseName:ex.name, muscleGroup:ex.muscleGroup, sets:3, reps:"10", weight:"", restSec:60, rpe:"", notes:"", sortOrder:d.exercises.length+1})
      }
    })
    setWeeks(w)
    setSelectedEx(new Set())
    setPicker(null)
    setSearchTerm("")
  }

  const removeEx = (wi:number, di:number, ei:number) => { const w=[...weeks]; w[wi].days[di].exercises=w[wi].days[di].exercises.filter((_,i)=>i!==ei).map((e,i)=>({...e,sortOrder:i+1})); setWeeks(w) }
  const updEx = (wi:number, di:number, ei:number, f:string, v:any) => { const w=[...weeks]; (w[wi].days[di].exercises[ei] as any)[f]=v; setWeeks(w) }

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault();setSaving(true)
    // Auto-fill Week 1 exercises into all other weeks
    const fillFromWeek1 = weeks.length > 1 && weeks[0].days.some(d => d.exercises.length > 0)
    const wkData = fillFromWeek1
      ? weeks.map((w, i) => i === 0 ? w : { ...w, days: JSON.parse(JSON.stringify(weeks[0].days)) })
      : weeks
    const res=await authFetch("/api/programs",{method:"POST",body:JSON.stringify({name,description:description||null,weeks:wkData})})
    if(!res.ok){alert("Failed");setSaving(false);return}
    const d=await res.json()
    const programId=d.program.id

    if(clientId){
      // Auto-assign to the client
      await authFetch("/api/programs/assign",{method:"POST",body:JSON.stringify({programId,clientId})})
      router.push(`/admin/clients/${clientId}`)
    }else{
      router.push(`/admin/programs/${programId}`)
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
      setExercises(prev => [...prev, newEx].sort((a,b) => a.name.localeCompare(b.name)))
      const nextSel = new Set(selectedEx)
      nextSel.add(newEx.id)
      setSelectedEx(nextSel)
      setShowNewExercise(false)
      setNewExName("")
      setNewExGroup("Chest")
      setNewExEquipment("")
    } else {
      alert("Failed to create exercise")
    }
    setCreatingEx(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-4">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href={clientId ? `/admin/clients/${clientId}` : "/admin/programs"} className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">New Program{clientId ? " for Client" : ""}</h1></div></header>
      <form onSubmit={handleSubmit} className="p-4 max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required/></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
          <div>
            <label className="block text-sm font-medium mb-2">Duration</label>
            <div className="flex gap-1.5">
              {[1,2,3,4,5,6,7,8].map(n => (
                <button key={n} type="button" onClick={() => setDuration(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${
                    duration === n ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>{n}</button>
              ))}
              <span className="text-xs text-gray-400 self-center ml-1">weeks</span>
            </div>
          </div>
        </div>
        {weeks.map((week,wi)=>(
          <div key={wi} className="bg-white rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b">
              <input type="text" value={week.name} onChange={e=>{const w=[...weeks];w[wi].name=e.target.value;setWeeks(w)}} className="font-medium text-sm bg-transparent p-0 focus:outline-none"/>
              <div className="flex items-center gap-2">
                <button type="button" onClick={()=>copyWeek(wi)} className="text-blue-400 hover:text-blue-600 text-xs flex items-center gap-0.5"><Copy size={12}/> Copy</button>
                {weeks.length>1&&<button type="button" onClick={()=>removeWeek(wi)} className="text-red-400 text-xs">Remove</button>}
              </div>
            </div>
            <div className="p-4 space-y-3">
              {week.days.map((day,di)=>(
                <div key={di} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <input type="text" value={day.dayName} onChange={e=>{const w=[...weeks];w[wi].days[di].dayName=e.target.value;setWeeks(w)}} className="font-medium text-sm bg-transparent p-0"/>
                    {week.days.length>1&&<button type="button" onClick={()=>removeDay(wi,di)} className="text-red-400 text-xs">Remove</button>}
                  </div>
                  <div className="space-y-2">
                    {day.exercises.map((ex:any,ei:number)=>(
                      <div key={ei} className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                        <div className="flex-1 space-y-1">
                          <p className="font-medium text-sm">{ex.exerciseName} <span className="text-xs text-gray-400">({ex.muscleGroup})</span></p>
                          <div className="flex flex-wrap gap-2">
                            <div><label className="text-xs text-gray-500">Sets</label><input type="number" value={ex.sets} onChange={e=>updEx(wi,di,ei,"sets",parseInt(e.target.value)||1)} className="w-12 px-1 py-0.5 border rounded text-xs text-center" min={1}/></div>
                            <div><label className="text-xs text-gray-500">Reps</label><input type="text" value={ex.reps} onChange={e=>updEx(wi,di,ei,"reps",e.target.value)} className="w-14 px-1 py-0.5 border rounded text-xs text-center"/></div>
                            <div><label className="text-xs text-gray-500">Weight</label><input type="text" value={ex.weight||""} onChange={e=>updEx(wi,di,ei,"weight",e.target.value)} className="w-16 px-1 py-0.5 border rounded text-xs text-center" placeholder="kg"/></div>
                            <div><label className="text-xs text-gray-500">Rest</label><select value={ex.restSec} onChange={e=>updEx(wi,di,ei,"restSec",parseInt(e.target.value))} className="w-16 px-1 py-0.5 border rounded text-xs"><option value={30}>30s</option><option value={60}>60s</option><option value={90}>90s</option><option value={120}>2m</option><option value={180}>3m</option></select></div>
                            <div><label className="text-xs text-gray-500">RPE</label><input type="text" value={ex.rpe} onChange={e=>updEx(wi,di,ei,"rpe",e.target.value)} className="w-12 px-1 py-0.5 border rounded text-xs text-center"/></div>
                          </div>
                          <input type="text" value={ex.notes} onChange={e=>updEx(wi,di,ei,"notes",e.target.value)} className="w-full text-xs text-gray-500 bg-transparent p-0" placeholder="Notes"/>
                        </div>
                        <button type="button" onClick={()=>removeEx(wi,di,ei)} className="text-red-300 hover:text-red-500"><X size={14}/></button>
                      </div>
                    ))}
                    <button type="button" onClick={()=>{setPicker({wi,di});setSelectedEx(new Set());setSearchTerm("");setShowNewExercise(false)}} className="text-sm text-blue-600 hover:text-blue-700"><Plus size={14}/> Add exercise</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={()=>addDay(wi)} className="text-sm text-gray-500"><Plus size={14}/> Add day</button>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
            <button type="button" onClick={addWeek} className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400">+ Add Week</button>
            <button type="button" onClick={fillFromWeek1} className="flex-1 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl text-sm hover:border-blue-400 hover:bg-blue-50">
              ↻ Fill Weeks from Week 1
            </button>
          </div>
        <button type="submit" disabled={saving||!name} className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"><Save size={18}/> {saving?"Creating...":"Create Program"}</button>
      </form>

      {picker&&<div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
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
                <button type="button" onClick={() => setShowNewExercise(true)} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5"><Plus size={12}/> New</button>
              )}
              <button onClick={()=>setPicker(null)} className="text-gray-400"><X size={18}/></button>
            </div>
          </div>
          <div className="p-3 flex-1 overflow-auto">
            {showNewExercise ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Exercise Name *</label>
                  <input type="text" value={newExName} onChange={e=>setNewExName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Bulgarian Split Squat" autoFocus/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Muscle Group *</label>
                  <select value={newExGroup} onChange={e=>setNewExGroup(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {["Chest","Back","Legs","Shoulders","Arms","Core","Cardio","Full Body"].map(g=><option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Equipment (optional)</label>
                  <input type="text" value={newExEquipment} onChange={e=>setNewExEquipment(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Barbell, Dumbbell"/>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={()=>{setShowNewExercise(false);setNewExName("");setNewExGroup("Chest");setNewExEquipment("")}} className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-600">Back</button>
                  <button type="button" onClick={handleCreateExercise} disabled={creatingEx||!newExName.trim()} className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
                    {creatingEx ? "Creating..." : "Create & Add"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input type="text" placeholder="Search exercises..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mb-3" autoFocus/>
                <div className="space-y-1">
                  {filtered.length===0?<p className="text-sm text-gray-400 text-center py-4">No exercises. <button type="button" onClick={()=>setShowNewExercise(true)} className="text-blue-600 hover:underline">Add one?</button></p>
                    :filtered.map(ex=>(
                      <button key={ex.id} type="button" onClick={()=>toggleSelect(ex.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between gap-2 ${
                          selectedEx.has(ex.id) ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"
                        }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedEx.has(ex.id) ? "bg-blue-600 border-blue-600" : "border-gray-300"
                          }`}>
                            {selectedEx.has(ex.id) && <Check size={12} className="text-white"/>}
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
            <button type="button" onClick={()=>setPicker(null)} className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-600">Cancel</button>
            <button type="button" onClick={addSelectedExercises} disabled={selectedEx.size===0}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50">
              Add {selectedEx.size > 0 ? `(${selectedEx.size})` : ""} Selected
            </button>
          </div>
        </div>
      </div>}
    </div>
  )
}

export default function NewProgramPage() {
  return <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}><NewProgramForm /></Suspense>
}