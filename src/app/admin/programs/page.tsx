"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, ArrowLeft, Search, FileText, Users } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

export default function ProgramListPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(()=>{if (!getUser()) window.location.href = "/admin/login"; authFetch("/api/programs").then(r=>r.json()).then(d=>{setPrograms(d.programs||[]);setLoading(false)})},[])

  const filtered = programs.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  const templates = filtered.filter(p=>!p.clientId)
  const assigned = filtered.filter(p=>p.clientId)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3"><Link href="/admin" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">Programs</h1></div>
        <Link href="/admin/programs/new" className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-purple-700"><Plus size={16}/>New</Link>
      </header>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="relative mb-4"><Search size={18} className="absolute..."/><input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"/></div>
        {loading?<div className="space-y-2">{[1,2,3].map(i=><div key={i} className="bg-white rounded-lg border p-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3"/></div>)}</div>
          :programs.length===0?<div className="text-center py-12"><p className="text-gray-400">No programs yet</p></div>
          :<>
            {assigned.length>0&&<div className="mb-6"><h2 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5"><Users size={14}/>Assigned</h2><div className="space-y-2">{assigned.map(p=><Link key={p.id} href={`/admin/programs/${p.id}`} className="flex items-center justify-between bg-white rounded-lg border p-4 hover:shadow-sm">
              <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-gray-400">{p.client?.name||"?"} · {p.status} · {p.weeks?.length||0}w</p></div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.status==="active"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{p.status}</span>
            </Link>)}</div></div>}
            <div><h2 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1.5"><FileText size={14}/>Templates</h2><div className="space-y-2">{templates.map(p=><Link key={p.id} href={`/admin/programs/${p.id}`} className="flex items-center justify-between bg-white rounded-lg border p-4 hover:shadow-sm">
              <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-gray-400">{p.description||"No desc"} · {p.weeks?.length||0}w</p></div>
              <span className="text-xs text-blue-600">Edit →</span>
            </Link>)}</div></div>
          </>}
      </div>
    </div>
  )
}