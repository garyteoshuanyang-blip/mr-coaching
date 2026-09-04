"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, ArrowLeft, Search } from "lucide-react"

export default function ClientListPage() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetch("/api/clients").then(r=>r.json()).then(d=>{setClients(d.clients||[]);setLoading(false)}) },[])

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3"><Link href="/admin" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">Clients</h1></div>
        <Link href="/admin/clients/new" className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"><Plus size={16}/>Add</Link>
      </header>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="relative mb-4"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"/></div>
        {loading?<div className="space-y-2">{[1,2,3].map(i=><div key={i} className="bg-white rounded-lg border p-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3"/></div>)}</div>
          :filtered.length===0?<div className="text-center py-12"><p className="text-gray-400">No clients yet</p></div>
          :<div className="space-y-2">{filtered.map(c=><Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center justify-between bg-white rounded-lg border p-4 hover:shadow-sm">
            <div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-gray-400">{c.email} · {c._count.assignedPrograms} program{c._count.assignedPrograms!==1?"s":""}</p></div>
            <div className="text-xs text-gray-300">View →</div>
          </Link>)}</div>}
      </div>
    </div>
  )
}