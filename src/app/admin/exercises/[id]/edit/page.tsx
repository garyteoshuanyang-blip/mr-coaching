"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

const MG = ["chest","back","legs","shoulders","arms","core","cardio","full_body","glutes","calves"]
const EQ = ["","barbell","dumbbell","kettlebell","bodyweight","machine","cable","band"]

export default function EditExercisePage() {
  const router = useRouter(); const params = useParams()
  const [name,setName]=useState(""); const [muscleGroup,setMuscleGroup]=useState(""); const [equipment,setEquipment]=useState(""); const [description,setDescription]=useState("")
  const [saving,setSaving]=useState(false); const [loading,setLoading]=useState(true)

  useEffect(() => { fetch(`/api/exercises/${params.id}`).then(r=>r.json()).then(e=>{setName(e.name);setMuscleGroup(e.muscleGroup);setEquipment(e.equipment||"");setDescription(e.description||"");setLoading(false)}) },[params.id])

  const handleSubmit=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);const res=await fetch(`/api/exercises/${params.id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,muscleGroup,equipment:equipment||null,description:description||null})});if(res.ok)router.push("/admin/exercises");else{alert("Failed");setSaving(false)}}
  const handleDelete=async()=>{if(!confirm("Delete?"))return;await fetch(`/api/exercises/${params.id}`,{method:"DELETE"});router.push("/admin/exercises")}

  if(loading)return<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3"><Link href="/admin/exercises" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">Edit Exercise</h1></div>
        <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
      </header>
      <div className="p-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-4 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required/></div>
          <div><label className="block text-sm font-medium mb-1">Muscle Group</label><select value={muscleGroup} onChange={e=>setMuscleGroup(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">{MG.map(m=><option key={m} value={m}>{m.replace("_"," ").replace(/\b\w/g,l=>l.toUpperCase())}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Equipment</label><select value={equipment} onChange={e=>setEquipment(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">{EQ.map(eq=><option key={eq} value={eq}>{eq?eq.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase()):"None"}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
          <button type="submit" disabled={saving||!name} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"><Save size={16}/>{saving?"Saving...":"Save"}</button>
        </form>
      </div>
    </div>
  )
}