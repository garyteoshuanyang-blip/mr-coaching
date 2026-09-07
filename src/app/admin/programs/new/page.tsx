"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Save, X, Copy, Check } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

export default function NewProgramPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [weeks, setWeeks] = useState([{ weekNumber: 1, name: "Week 1", days: [{ dayName: "Day 1", dayOrder: 1, exercises: [] as any[] }] }])
  const [exercises, setExercises] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState<{wi:number;di:number}|null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEx, setSelectedEx] = useState<Set<string>>(new Set())

  useEffect(()=>{if (!getUser()) window.location.href = "/admin/login"; authFetch("/api/exercises").then(r=>r.json()).then(d=>setExercises(d.exercises||[]))},[])

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

  const addDay = (wi:number) => { const w=[...weeks]; const o=w[wi].days.length+1; w[wi].days.push({dayName:`Day ${o}`, dayOrder:o, exercises:[]}); setWeeks(w) }
  const removeDay = (wi:number, di:number) => { const w=[...weeks]; w[wi].days=w[wi].days.filter((_,i)=>i!==di).map((d,i)=>({...d,dayOrder:i+1})); setWeeks(w) }

  const addEx = (wi:number, di:number, ex:any) => {
    const w=[...weeks]; const d=w[wi].days[di]
    d.exercises.push({exerciseId:ex.id, exerciseName:ex.name, muscleGroup:ex.muscleGroup, sets:3, reps:"10", restSec:60, rpe:"", notes:"", sortOrder:d.exercises.length+1})
    setWeeks(w)
  }

  const addSelectedExercises = () => {
    if (!picker || selectedEx.size === 0) return
    const w=[...weeks]; const d=w[picker.wi].days[picker.di]
    exercises.filter(e => selectedEx.has(e.id)).forEach(ex => {
      if (!d.exercises.find((x:any) => x.exerciseId === ex.id)) {
        d.exercises.push({exerciseId:ex.id, exerciseName:ex.name, muscleGroup:ex.muscleGroup, sets:3, reps:"10", restSec:60, rpe:"", notes:"", sortOrder:d.exercises.length+1})
      }
    })
    setWeeks(w)
    setSelectedEx(new Set())
    setPicker(null)
    setSearchTerm("")
  }

  const removeEx = (wi:number, di:number, ei:number) => { const w=[...weeks]; w[wi].days[di].exercises=w[wi].days[di].exercises.filter((_,i)=>i!==ei).map((e,i)=>({...e,sortOrder:i+1})); setWeeks(w) }
  const updEx = (wi:number, di:number, ei:number, f:string, v:any) => { const w=[...weeks]; (w[wi].days[di].exercises[ei] as any)[f]=v; setWeeks(w) }

  const handleSubmit=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);const res=await authFetch("/api/programs",{method:"POST",body:JSON.stringify({name,description:description||null,weeks})});if(res.ok){const d=await res.json();router.push(`/admin/programs/${d.program.id}`)}else{alert("Failed");setSaving(false)}}

  const toggleSelect = (id: string) => {
    const next = new Set(selectedEx)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedEx(next)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-4">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href="/admin/programs" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">New Program</h1></div></header>
      <form onSubmit={handleSubmit} className="p-4 max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required/></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
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
                            <div><label className="text-xs text-gray-500">Rest</label><select value={ex.restSec} onChange={e=>updEx(wi,di,ei,"restSec",parseInt(e.target.value))} className="w-16 px-1 py-0.5 border rounded text-xs"><option value={30}>30s</option><option value={60}>60s</option><option value={90}>90s</option><option value={120}>2m</option><option value={180}>3m</option></select></div>
                            <div><label className="text-xs text-gray-500">RPE</label><input type="text" value={ex.rpe} onChange={e=>updEx(wi,di,ei,"rpe",e.target.value)} className="w-12 px-1 py-0.5 border rounded text-xs text-center"/></div>
                          </div>
                          <input type="text" value={ex.notes} onChange={e=>updEx(wi,di,ei,"notes",e.target.value)} className="w-full text-xs text-gray-500 bg-transparent p-0" placeholder="Notes"/>
                        </div>
                        <button type="button" onClick={()=>removeEx(wi,di,ei)} className="text-red-300 hover:text-red-500"><X size={14}/></button>
                      </div>
                    ))}
                    <button type="button" onClick={()=>{setPicker({wi,di});setSelectedEx(new Set());setSearchTerm("")}} className="text-sm text-blue-600 hover:text-blue-700"><Plus size={14}/> Add exercise</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={()=>addDay(wi)} className="text-sm text-gray-500"><Plus size={14}/> Add day</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addWeek} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-gray-400">+ Add Week</button>
        <button type="submit" disabled={saving||!name} className="w-full bg-purple-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"><Save size={18}/> {saving?"Creating...":"Create Program"}</button>
      </form>

      {picker&&<div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
          <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm">Select Exercises</h3>
              {selectedEx.size > 0 && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{selectedEx.size} selected</span>}
            </div>
            <button onClick={()=>setPicker(null)} className="text-gray-400"><X size={18}/></button>
          </div>
          <div className="p-3 flex-1 overflow-auto">
            <input type="text" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mb-3" autoFocus/>
            <div className="space-y-1">
              {filtered.length===0?<p className="text-sm text-gray-400 text-center py-4">No exercises. Add one first.</p>
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