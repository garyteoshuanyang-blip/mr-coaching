"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Plus } from "lucide-react"
import type { Program, BodyWeightLog } from "@prisma/client"

export default function ClientDetailPage() {
  const params = useParams(); const router = useRouter()
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true)

  useEffect(()=>{fetch(`/api/clients/${params.id}`).then(r=>r.json()).then(setData).then(()=>setLoading(false))},[params.id])

  const handleDelete=async()=>{if(!confirm("Delete?"))return;await fetch(`/api/clients/${params.id}`,{method:"DELETE"});router.push("/admin/clients")}

  if(loading)return<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>
  if(!data)return<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Not found</p></div>

  const bw = data.bodyWeightLogs || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3"><Link href="/admin/clients" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">{data.name}</h1></div>
        <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
      </header>
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-sm text-gray-500">{data.email}</p>
          {bw.length>0&&<p className="text-sm mt-2">Last weight: <span className="font-medium">{bw[0].weight} kg</span></p>}
        </div>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Programs</h2>
          <Link href={`/admin/programs/assign?clientId=${params.id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus size={14}/>Assign</Link>
        </div>
        {data.assignedPrograms?.length>0?<div className="space-y-2">{data.assignedPrograms.map((p:any)=>(
          <Link key={p.id} href={`/admin/programs/${p.id}`} className="flex items-center justify-between bg-white rounded-lg border p-4 hover:shadow-sm">
            <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-gray-400 capitalize">{p.status} · {p.weeks?.length||0} weeks</p></div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${p.status==="active"?"bg-green-100 text-green-700":"bg-gray-100 text-gray-500"}`}>{p.status}</span>
          </Link>
        ))}</div>:<p className="text-sm text-gray-400">No programs assigned.</p>}
      </div>
    </div>
  )
}