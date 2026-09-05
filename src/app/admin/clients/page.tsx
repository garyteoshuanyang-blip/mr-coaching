"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, ArrowLeft, Search, Copy, Check } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

export default function ClientListPage() {
  const [clients, setClients] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!getUser()) window.location.href = "/admin/login"
    authFetch("/api/clients").then(r => r.json()).then(d => { setClients(d.clients || []); setLoading(false) })
  }, [])

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || (c.clientSlug || "").includes(search.toLowerCase()))

  const copySlug = (slug: string, id: string) => {
    navigator.clipboard.writeText(slug)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3"><Link href="/admin" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">Clients</h1></div>
        <Link href="/admin/clients/new" className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"><Plus size={16}/>Add</Link>
      </header>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="relative mb-4"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" placeholder="Search name or slug..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"/></div>
        {loading?<div className="space-y-2">{[1,2,3].map(i=><div key={i} className="bg-white rounded-lg border p-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3"/></div>)}</div>
          :filtered.length===0?<div className="text-center py-12"><p className="text-gray-400">No clients yet</p></div>
          :<div className="space-y-2">{filtered.map(c=><Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center justify-between bg-white rounded-lg border p-4 hover:shadow-sm">
            <div>
              <p className="font-medium text-sm">{c.name}</p>
              <p className="text-xs text-gray-400">
                {c.clientSlug ? <span className="text-blue-600 font-medium">{c.clientSlug}</span> : "no slug"} · {c._count.assignedPrograms} program{c._count.assignedPrograms!==1?"s":""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {c.clientSlug && (
                <button onClick={(e) => { e.preventDefault(); copySlug(c.clientSlug, c.id) }} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-500">
                  {copiedId === c.id ? <Check size={12} className="text-green-600"/> : <Copy size={12}/>} {copiedId === c.id ? "Copied!" : "Copy"}
                </button>
              )}
              <div className="text-xs text-gray-300">View →</div>
            </div>
          </Link>)}</div>}
      </div>
    </div>
  )
}