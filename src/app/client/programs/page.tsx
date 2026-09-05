"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

export default function ClientProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([]); const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getUser()) window.location.href = "/client/access"
    authFetch("/api/programs/client").then(r => r.json()).then(d => { setPrograms(d.programs || []); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href="/client" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">My Programs</h1></div></header>
      <div className="p-4 max-w-2xl mx-auto">
        {loading ? <div className="space-y-2">{[1,2].map(i => <div key={i} className="bg-white rounded-lg border p-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3"/></div>)}</div>
          : programs.length === 0 ? <div className="text-center py-12"><p className="text-gray-400">No programs assigned yet.</p></div>
          : <div className="space-y-3">{programs.map(p => (
            <Link key={p.id} href={`/client/programs/${p.id}`} className="block bg-white rounded-xl border p-4 hover:shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium">{p.name}</h3>
                {p.status === "active" ? <span className="text-xs flex items-center gap-1 text-green-600"><CheckCircle size={12}/>Active</span> : <span className="text-xs flex items-center gap-1 text-gray-400"><XCircle size={12}/>Completed</span>}
              </div>
              {p.description && <p className="text-sm text-gray-500">{p.description}</p>}
              <p className="text-xs text-gray-400 mt-2">{p.weeks?.length || 0} weeks</p>
            </Link>
          ))}</div>}
      </div>
    </div>
  )
}