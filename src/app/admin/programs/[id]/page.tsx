"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Edit3, Users, CheckCircle, XCircle } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

export default function ProgramDetailPage() {
  const params = useParams(); const router = useRouter()
  const [program, setProgram] = useState<any>(null); const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false); const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [status, setStatus] = useState("")

  useEffect(()=>{if (!getUser()) window.location.href = "/admin/login"; authFetch(`/api/programs/${params.id}`).then(r=>r.json()).then(d=>{setProgram(d);setName(d.name);setDescription(d.description||"");setStatus(d.status);setLoading(false)})},[params.id])

  const handleSave=async()=>{const res=await authFetch(`/api/programs/${params.id}`,{method:"PUT",body:JSON.stringify({name,description,status})});if(res.ok){setEditMode(false);setProgram((p:any)=>({...p,name,description,status}))}else alert("Failed")}
  const handleDelete=async()=>{if(!confirm("Delete?"))return;await authFetch(`/api/programs/${params.id}`,{method:"DELETE"});router.push("/admin/programs")}

  if(loading)return<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>
  if(!program)return<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Not found</p></div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3"><Link href="/admin/programs" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">{program.name}</h1></div>
        <div className="flex items-center gap-2">
          {!program.clientId&&<Link href={`/admin/programs/assign?programId=${params.id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Users size={14}/>Assign</Link>}
          <button onClick={()=>setEditMode(!editMode)} className="p-2 text-gray-400"><Edit3 size={18}/></button>
          <button onClick={handleDelete} className="p-2 text-red-400"><Trash2 size={18}/></button>
        </div>
      </header>
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {editMode?<div className="bg-white rounded-xl border p-4 space-y-3">
          <input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"/>
          <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg text-sm"/>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="active">Active</option><option value="completed">Completed</option></select>
          <div className="flex gap-2"><button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm">Save</button><button onClick={()=>setEditMode(false)} className="text-gray-500 px-4 py-1.5 text-sm">Cancel</button></div>
        </div>:<div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-1"><span className={`text-xs px-2 py-0.5 rounded-full ${program.status==="active"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{program.status}</span>{program.client&&<span className="text-xs text-gray-400">Assigned to {program.client.name}</span>}{!program.client&&<span className="text-xs text-gray-400">Template</span>}</div>
          {program.description&&<p className="text-sm text-gray-600 mt-2">{program.description}</p>}
          <p className="text-xs text-gray-400 mt-2">{program.weeks?.length} weeks</p>
        </div>}
        {program.weeks?.map((week:any)=><div key={week.id} className="bg-white rounded-xl border overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b"><p className="font-medium text-sm">{week.name}</p></div>
          <div className="p-4 space-y-3">{week.days?.map((day:any)=><div key={day.id} className="border rounded-lg p-3">
            <p className="font-medium text-sm text-gray-700 mb-2">{day.dayName}</p>
            <div className="space-y-1.5">{day.exercises?.map((ex:any)=><div key={ex.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div><p className="text-sm font-medium">{ex.exercise.name} <span className="text-xs text-gray-400">({ex.exercise.muscleGroup})</span></p>
              <p className="text-xs text-gray-500">{ex.sets}×{ex.reps}{ex.restSec?` · ${ex.restSec<60?`${ex.restSec}s`:`${ex.restSec/60}m`} rest`:""}{ex.rpe?` · RPE ${ex.rpe}`:""}</p></div>
            </div>)}</div>
          </div>)}</div>
        </div>)}
      </div>
    </div>
  )
}