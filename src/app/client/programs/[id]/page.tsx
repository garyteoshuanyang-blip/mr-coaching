"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle } from "lucide-react"

export default function ClientProgramDetailPage() {
  const params = useParams()
  const [program, setProgram] = useState<any>(null); const [loading, setLoading] = useState(true)
  const [loggingDay, setLoggingDay] = useState<string|null>(null)
  const [setsData, setSetsData] = useState<Record<string,{set:number;reps:number;weight:number;rpe?:number}[]>>({})
  const [saving, setSaving] = useState(false)

  useEffect(()=>{fetch(`/api/programs/${params.id}`).then(r=>r.json()).then(d=>{
    setProgram(d)
    const init:Record<string,any>={}
    d.weeks?.forEach((w:any)=>w.days?.forEach((day:any)=>day.exercises?.forEach((ex:any)=>{
      const log=ex.logs?.find((l:any)=>l.completed)
      if(log?.loggedSets){try{init[ex.id]=JSON.parse(log.loggedSets)}catch{}}
    })))
    setSetsData(init);setLoading(false)
  })},[params.id])

  const selectDay=(dayId:string)=>{
    setLoggingDay(dayId)
    if(!program)return
    const day=program.weeks.flatMap((w:any)=>w.days).find((d:any)=>d.id===dayId)
    if(!day)return
    const ns={...setsData}
    day.exercises.forEach((ex:any)=>{if(!ns[ex.id]){ns[ex.id]=Array.from({length:ex.sets},(_,i)=>({set:i+1,reps:parseInt(ex.reps)||10,weight:0}))}})
    setSetsData(ns)
  }

  const updateSet=(exId:string,si:number,f:string,v:number)=>{const ns={...setsData};const es=[...(ns[exId]||[])];es[si]={...es[si],[f]:v};ns[exId]=es;setSetsData(ns)}

  const completeWorkout=async()=>{
    if(!loggingDay||!program)return;setSaving(true)
    const day=program.weeks.flatMap((w:any)=>w.days).find((d:any)=>d.id===loggingDay)
    if(!day)return;const today=new Date().toISOString().split("T")[0]
    for(const ex of day.exercises){const logged=setsData[ex.id];if(!logged)continue;await fetch("/api/workout-logs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({workoutExerciseId:ex.id,date:today,loggedSets:JSON.stringify(logged),completed:true})})}
    setSaving(false);setLoggingDay(null);window.location.reload()
  }

  if(loading)return<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>
  if(!program)return<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Not found</p></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href="/client/programs" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">{program.name}</h1></div></header>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {program.weeks?.map((week:any)=><div key={week.id} className="bg-white rounded-xl border overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b"><p className="font-medium text-sm">{week.name}</p></div>
          <div className="p-4 space-y-3">{week.days?.map((day:any)=>{
            const allDone=day.exercises.every((ex:any)=>ex.logs?.some((l:any)=>l.completed))
            return <div key={day.id} className="border rounded-lg p-3">
              <button onClick={()=>setLoggingDay(day.id===loggingDay?null:day.id)} className="w-full flex items-center justify-between">
                <p className="font-medium text-sm flex items-center gap-2">{day.dayName}{allDone&&<CheckCircle size={14} className="text-green-500"/>}</p>
                <span className="text-xs text-green-600">{allDone?"Completed":"Log →"}</span>
              </button>
              {loggingDay===day.id&&<div className="mt-3 space-y-4">
                {day.exercises.map((ex:any)=><div key={ex.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-medium text-sm mb-2">{ex.exercise.name} <span className="text-xs text-gray-400">({ex.sets}×{ex.reps})</span></p>
                  <div className="space-y-1.5">{(setsData[ex.id]||[]).map((set,si)=><div key={si} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-gray-500">S{si+1}</span>
                    <input type="number" value={set.reps||""} onChange={e=>updateSet(ex.id,si,"reps",parseInt(e.target.value)||0)} className="w-12 px-1 py-1 border rounded text-center" placeholder="Reps" min={0}/>
                    <span className="text-gray-400">×</span>
                    <input type="number" value={set.weight||""} onChange={e=>updateSet(ex.id,si,"weight",parseFloat(e.target.value)||0)} className="w-16 px-1 py-1 border rounded text-center" placeholder="kg" min={0} step={0.5}/>
                    <span className="text-gray-400">kg</span>
                    <input type="number" value={set.rpe||""} onChange={e=>updateSet(ex.id,si,"rpe",parseInt(e.target.value)||0)} className="w-10 px-1 py-1 border rounded text-center" placeholder="RPE" min={1} max={10}/>
                  </div>)}</div>
                </div>)}
                <button onClick={completeWorkout} disabled={saving} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">{saving?"Saving...":"Complete Workout"}</button>
                <button onClick={()=>setLoggingDay(null)} className="w-full text-sm text-gray-400 py-1">Cancel</button>
              </div>}
            </div>
          })}</div>
        </div>)}
      </div>
    </div>
  )
}