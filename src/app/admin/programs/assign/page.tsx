"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, UserCheck } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

function AssignForm() {
  const router = useRouter(); const params = useSearchParams()
  const programId = params.get("programId"); const clientId = params.get("clientId")
  const [programs, setPrograms] = useState<any[]>([]); const [clients, setClients] = useState<any[]>([])
  const [selProg, setSelProg] = useState(programId||""); const [selCli, setSelCli] = useState(clientId||""); const [saving, setSaving] = useState(false)

  useEffect(()=>{if (!getUser()) window.location.href = "/admin/login"; authFetch("/api/programs").then(r=>r.json()).then(d=>setPrograms(d.programs.filter((p:any)=>!p.clientId)));authFetch("/api/clients").then(r=>r.json()).then(d=>setClients(d.clients||[]))},[])

  const handleAssign=async()=>{if(!selProg||!selCli)return;setSaving(true);const res=await authFetch("/api/programs/assign",{method:"POST",body:JSON.stringify({programId:selProg,clientId:selCli})});if(res.ok)router.push(clientId?`/admin/clients/${selCli}`:"/admin/programs");else{alert("Failed");setSaving(false)}}

  return (
    <div className="bg-white rounded-xl border p-4 space-y-4">
      <div><label className="block text-sm font-medium mb-1">Program (template)</label>
        <select value={selProg} onChange={e=>setSelProg(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Choose...</option>{programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <div><label className="block text-sm font-medium mb-1">Client</label>
        <select value={selCli} onChange={e=>setSelCli(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Choose...</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <button onClick={handleAssign} disabled={saving||!selProg||!selCli} className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"><UserCheck size={16}/>{saving?"Assigning...":"Assign"}</button>
    </div>
  )
}

export default function AssignProgramPage() {
  return (<div className="min-h-screen bg-gray-50"><header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href="/admin/programs" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">Assign Program</h1></div></header><div className="p-4 max-w-lg mx-auto"><Suspense fallback={<div className="text-center py-8 text-sm text-gray-400">Loading...</div>}><AssignForm/></Suspense></div></div>)
}