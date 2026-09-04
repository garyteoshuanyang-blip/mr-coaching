"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp } from "lucide-react"

export default function ClientProgressPage() {
  const [weights, setWeights] = useState<any[]>([]); const [loading, setLoading] = useState(true)

  useEffect(()=>{fetch("/api/body-weight").then(r=>r.json()).then(d=>{setWeights(d.logs||[]);setLoading(false)})},[])

  const sorted = [...weights].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime())
  const latest = sorted[sorted.length-1]; const first = sorted[0]
  const change = latest&&first?(latest.weight-first.weight).toFixed(1):null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href="/client" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">Progress</h1></div></header>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-medium text-sm mb-3 flex items-center gap-1.5"><TrendingUp size={16}/> Body Weight</h2>
          {loading?<p className="text-sm text-gray-400">Loading...</p>:sorted.length===0?<p className="text-sm text-gray-400">No weight logs yet.</p>:<>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div><div className="text-lg font-bold text-blue-600">{latest?.weight??"—"}</div><div className="text-xs text-gray-500">Current (kg)</div></div>
              <div><div className="text-lg font-bold text-gray-700">{first?.weight??"—"}</div><div className="text-xs text-gray-500">First (kg)</div></div>
              <div><div className={`text-lg font-bold ${Number(change||0)>0?"text-green-600":"text-red-500"}`}>{change?`${Number(change)>0?"+":""}${change}`:"—"}</div><div className="text-xs text-gray-500">Change (kg)</div></div>
            </div>
            <div className="space-y-1">{sorted.slice(-10).map((pt,i)=>{
              const max=Math.max(...sorted.map((w:any)=>w.weight));const min=Math.min(...sorted.map((w:any)=>w.weight));const range=max-min||1;const pct=((pt.weight-min)/range)*100
              const date=new Date(pt.date).toLocaleDateString("en-SG",{day:"numeric",month:"short"})
              return <div key={i} className="flex items-center gap-2 text-xs"><span className="w-16 text-gray-400">{date}</span><div className="flex-1 bg-gray-100 rounded-full h-4"><div className="bg-blue-500 h-full rounded-full" style={{width:`${pct}%`}}/></div><span className="w-12 text-right font-medium">{pt.weight}</span></div>
            })}</div>
          </>}
        </div>
      </div>
    </div>
  )
}