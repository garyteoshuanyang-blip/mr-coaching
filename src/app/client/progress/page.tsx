"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getUser, authFetch } from "@/lib/client-auth"

export default function ClientProgressPage() {
  const [weights, setWeights] = useState<any[]>([]); const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getUser()) window.location.href = "/client/access"
    authFetch("/api/body-weight").then(r => r.json()).then(d => { setWeights(d.logs || []); setLoading(false) })
  }, [])

  const sorted = [...weights].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const latest = sorted[sorted.length - 1]; const first = sorted[0]
  const change = latest && first ? (latest.weight - first.weight).toFixed(1) : null
  const maxWeight = sorted.length > 0 ? Math.max(...sorted.map(w => w.weight)) : 0
  const minWeight = sorted.length > 0 ? Math.min(...sorted.map(w => w.weight)) : 0

  const chartData = sorted.map(w => ({
    date: new Date(w.date).toLocaleDateString("en-SG", { day: "numeric", month: "short" }),
    weight: w.weight,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href="/client" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">Progress</h1></div></header>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-medium text-sm mb-3 flex items-center gap-1.5"><TrendingUp size={16}/> Body Weight</h2>
          {loading ? <p className="text-sm text-gray-400">Loading...</p> : sorted.length === 0 ? <p className="text-sm text-gray-400">No weight logs yet.</p> : <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div><div className="text-lg font-bold text-blue-600">{latest?.weight ?? "—"}</div><div className="text-xs text-gray-500">Current (kg)</div></div>
              <div><div className="text-lg font-bold text-gray-700">{first?.weight ?? "—"}</div><div className="text-xs text-gray-500">First (kg)</div></div>
              <div><div className={`text-lg font-bold ${Number(change || 0) > 0 ? "text-green-600" : "text-red-500"}`}>{change ? `${Number(change) > 0 ? "+" : ""}${change}` : "—"}</div><div className="text-xs text-gray-500">Change (kg)</div></div>
            </div>
            {sorted.length >= 2 && (
              <div className="mb-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis domain={[Math.max(0, minWeight - 5), maxWeight + 5]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value: number) => [`${value} kg`, "Weight"]} />
                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <p className="text-xs text-gray-400 mb-2">All logs:</p>
            <div className="space-y-1">{sorted.slice(-20).reverse().map((pt: any, i: number) => {
              const date = new Date(pt.date).toLocaleDateString("en-SG", { day: "numeric", month: "short" })
              return (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400">{date}</span>
                  <span className="font-medium">{pt.weight} kg</span>
                </div>
              )
            })}</div>
          </>}
        </div>
      </div>
    </div>
  )
}