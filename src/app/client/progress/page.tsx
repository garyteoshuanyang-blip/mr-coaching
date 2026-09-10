"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, TrendingUp, BarChart3, Dumbbell } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getUser, authFetch } from "@/lib/client-auth"

export default function ClientProgressPage() {
  const [weights, setWeights] = useState<any[]>([]); const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<any>(null); const [progLoading, setProgLoading] = useState(true)

  useEffect(() => {
    if (!getUser()) window.location.href = "/client/access"
    const user = getUser()
    authFetch("/api/body-weight").then(r => r.json()).then(d => { setWeights(d.logs || []); setLoading(false) })
    if (user?.id) {
      authFetch(`/api/clients/${user.id}/progress`).then(r => r.json()).then(d => { setProgress(d); setProgLoading(false) })
    }
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

  const hasData = sorted.length > 0 || (progress?.exerciseComparison?.length > 0)

  let bodyWeightSection: React.ReactNode = null
  if (loading) {
    bodyWeightSection = <p className="text-sm text-gray-400">Loading...</p>
  } else if (sorted.length === 0) {
    bodyWeightSection = <p className="text-sm text-gray-400">No weight logs yet.</p>
  } else {
    bodyWeightSection = (
      <>
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
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value: any) => [`${value} kg`, "Weight"]} />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="text-xs text-gray-400 mb-2">All logs:</p>
        <div className="space-y-1">
          {sorted.slice(-20).reverse().map((pt: any, i: number) => {
            const date = new Date(pt.date).toLocaleDateString("en-SG", { day: "numeric", month: "short" })
            return (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-400">{date}</span>
                <span className="font-medium">{pt.weight} kg</span>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  const weekComp = (!progLoading && progress?.weekComparison && (progress.weekComparison.thisWeek.totalVolume > 0 || progress.weekComparison.lastWeek.totalVolume > 0))
  const exComp = (!progLoading && progress?.exerciseComparison?.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href="/client" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">Progress</h1></div></header>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-medium text-sm mb-3 flex items-center gap-1.5"><TrendingUp size={16}/> Body Weight</h2>
          {bodyWeightSection}
        </div>

        {weekComp && (
          <div className="bg-white rounded-xl border p-4">
            <h2 className="font-medium text-sm mb-3 flex items-center gap-1.5"><BarChart3 size={16}/> Week Comparison</h2>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Last week</div>
                <div className="text-lg font-bold text-gray-700">{progress.weekComparison.lastWeek.totalVolume.toLocaleString()}</div>
                <div className="text-xs text-gray-400">{progress.weekComparison.lastWeek.sessionCount} sessions</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-xs text-gray-500 mb-1">This week</div>
                <div className="text-lg font-bold text-blue-600">{progress.weekComparison.thisWeek.totalVolume.toLocaleString()}</div>
                <div className="text-xs text-gray-400">{progress.weekComparison.thisWeek.sessionCount} sessions</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Change</div>
                <div className={`text-lg font-bold ${progress.weekComparison.changePct > 0 ? "text-green-600" : progress.weekComparison.changePct < 0 ? "text-red-500" : "text-gray-500"}`}>
                  {progress.weekComparison.changePct > 0 ? "+" : ""}{progress.weekComparison.changePct}%
                </div>
                <div className="text-xs text-gray-400">volume</div>
              </div>
            </div>
            <p className="text-xs text-gray-400">Total volume = weight × reps across all logged sets</p>
          </div>
        )}

        {exComp && (
          <div className="bg-white rounded-xl border p-4">
            <h2 className="font-medium text-sm mb-3 flex items-center gap-1.5"><Dumbbell size={16}/> Exercise Progression</h2>
            <div className="space-y-2">
              {progress.exerciseComparison.map((ex: any) => (
                <div key={ex.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{ex.name}</p>
                    <p className="text-xs text-gray-400">
                      {ex.previous ? `Last: ${ex.latest}kg` : `${ex.latest}kg`}
                      {ex.previous && ex.changePct !== null && (
                        <span className={ex.changePct > 0 ? "text-green-600 ml-1" : ex.changePct < 0 ? "text-red-500 ml-1" : "text-gray-500 ml-1"}>
                          ({ex.changePct > 0 ? "+" : ""}{ex.changePct}%)
                        </span>
                      )}
                    </p>
                  </div>
                  {ex.previous && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">{ex.previous}kg</span>
                      <span className="text-xs text-gray-300">→</span>
                      <span className="text-xs font-medium text-blue-600">{ex.latest}kg</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !progLoading && !hasData && (
          <p className="text-sm text-gray-400 text-center py-4">No data yet. Start logging workouts and weight to see trends here.</p>
        )}
      </div>
    </div>
  )
}