"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Plus, Edit3, Check, X, Copy, FileText, ExternalLink, TrendingUp, BarChart3 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getUser, authFetch } from "@/lib/client-auth"

export default function ClientDetailPage() {
  const params = useParams(); const router = useRouter()
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false); const [editName, setEditName] = useState(""); const [editSlug, setEditSlug] = useState("")
  const [saving, setSaving] = useState(false); const [copied, setCopied] = useState(false); const [linkCopied, setLinkCopied] = useState(false)
  const [tab, setTab] = useState<"programs" | "trends">("programs")
  const [progress, setProgress] = useState<any>(null); const [progressLoading, setProgressLoading] = useState(false)

  useEffect(() => {
    if (!getUser()) window.location.href = "/admin/login"
    authFetch(`/api/clients/${params.id}`).then(r => r.json()).then(d => { setData(d); setEditName(d.name); setEditSlug(d.clientSlug || ""); setLoading(false) })
  }, [params.id])

  useEffect(() => {
    if (tab === "trends" && !progress && !progressLoading) {
      setProgressLoading(true)
      authFetch(`/api/clients/${params.id}/progress`).then(r => r.json()).then(d => { setProgress(d); setProgressLoading(false) })
    }
  }, [tab, params.id, progress, progressLoading])

  const handleDelete = async () => { if (!confirm("Delete this client and all their data?")) return; await authFetch(`/api/clients/${params.id}`, { method: "DELETE" }); router.push("/admin/clients") }

  const handleSave = async () => {
    setSaving(true)
    const res = await authFetch(`/api/clients/${params.id}`, { method: "PATCH", body: JSON.stringify({ name: editName, clientSlug: editSlug }) })
    if (res.ok) { setEditing(false); const d = await res.json(); setData((prev: any) => ({ ...prev, name: d.client.name, clientSlug: d.client.clientSlug })); }
    else { const d = await res.json(); alert(d.error || "Failed") }
    setSaving(false)
  }

  const copySlug = () => { navigator.clipboard.writeText(data.clientSlug); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  const copyLink = () => {
    const link = `${window.location.origin}/client/link/${data.clientSlug}`
    navigator.clipboard.writeText(link); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000)
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>
  if (!data) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Not found</p></div>

  const bw = data.bodyWeightLogs || []

  const programsContent = (
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Programs</h2>
          <Link href={`/admin/programs/new?clientId=${params.id}`} className="text-sm text-purple-600 hover:underline flex items-center gap-1"><FileText size={14}/>New Program</Link>
        </div>
        {data.assignedPrograms?.length > 0 ? (
          <div className="space-y-2">
            {data.assignedPrograms.map((p: any) => {
              const startDate = p.startDate ? new Date(p.startDate) : null
              const daysSince = startDate ? Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null
              return (
                <Link key={p.id} href={`/admin/programs/${p.id}`} className="block bg-white rounded-lg border p-4 hover:shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">{p.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.status}</span>
                  </div>
                  <p className="text-xs text-gray-400">{p.weeks?.length || 0} weeks</p>
                  {startDate && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Started {startDate.toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}
                      {daysSince !== null && <span> · {daysSince}d ago</span>}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No programs assigned.</p>
        )}
      </div>
    )

    const trendsContent = !progress ? null : (
      <div className="space-y-4">
        {progressLoading ? <p className="text-sm text-gray-400">Loading trends...</p> : !progress ? null : <>
          {/* Body weight chart */}
            <div className="bg-white rounded-xl border p-4">
              <h2 className="font-medium text-sm mb-3 flex items-center gap-1.5"><TrendingUp size={16}/> Body Weight</h2>
              {progress.bodyWeight?.length < 2 ? <p className="text-sm text-gray-400">Need at least 2 weight logs to show a trend.</p> : <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div><div className="text-lg font-bold text-blue-600">{progress.bodyWeight[progress.bodyWeight.length-1]?.weight ?? "—"}</div><div className="text-xs text-gray-500">Current (kg)</div></div>
                  <div><div className="text-lg font-bold text-gray-700">{progress.bodyWeight[0]?.weight ?? "—"}</div><div className="text-xs text-gray-500">First (kg)</div></div>
                  <div><div className={`text-lg font-bold ${(progress.bodyWeight[progress.bodyWeight.length-1]?.weight - progress.bodyWeight[0]?.weight) > 0 ? "text-green-600" : "text-red-500"}`}>
                    {progress.bodyWeight.length >= 2 ? `${(progress.bodyWeight[progress.bodyWeight.length-1].weight - progress.bodyWeight[0].weight) > 0 ? "+" : ""}${(progress.bodyWeight[progress.bodyWeight.length-1].weight - progress.bodyWeight[0].weight).toFixed(1)}` : "—"}</div><div className="text-xs text-gray-500">Change (kg)</div></div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={progress.bodyWeight} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value: any) => [`${value} kg`, "Weight"]} />
                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </>}
            </div>

            {/* Week-over-week comparison */}
            {progress.weekComparison && (progress.weekComparison.thisWeek.totalVolume > 0 || progress.weekComparison.lastWeek.totalVolume > 0) && (
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

            {/* Exercise comparison */}
            {progress.exerciseComparison?.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <h2 className="font-medium text-sm mb-3 flex items-center gap-1.5"><TrendingUp size={16}/> Exercise Progression</h2>
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
          </>}
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3"><Link href="/admin/clients" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">{data.name}</h1></div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditing(!editing); if (!editing) { setEditName(data.name); setEditSlug(data.clientSlug || "") } }} className="p-2 text-gray-400 hover:text-blue-600"><Edit3 size={18}/></button>
          <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
        </div>
      </header>
      <div className="p-4 max-w-4xl mx-auto space-y-4 pb-20 md:pb-4">
        <div className="bg-white rounded-xl border p-4">
          {editing ? (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Name</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Client Slug</label><input type="text" value={editSlug} onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, ""))} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm"><Check size={14}/>{saving ? "Saving..." : "Save"}</button>
                <button onClick={() => setEditing(false)} className="text-gray-500 px-3 py-1.5 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">{data.clientSlug ? `Slug: ${data.clientSlug}` : "No slug set"}</p>
              {data.clientSlug && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <button onClick={copySlug} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-gray-100"><Copy size={12}/> {copied ? "Copied!" : "Copy slug"}</button>
                  <button onClick={copyLink} className="text-xs flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-600"><ExternalLink size={12}/> {linkCopied ? "Copied!" : "Copy login link"}</button>
                </div>
              )}
              {bw.length > 0 && <p className="text-sm mt-2">Last weight: <span className="font-medium">{bw[0].weight} kg</span></p>}
            </>
          )}
        </div>

        <div className="flex bg-white rounded-xl border overflow-hidden">
          <button onClick={() => setTab("programs")}
            className={`flex-1 py-2.5 text-sm font-medium text-center ${tab === "programs" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>Programs</button>
          <button onClick={() => setTab("trends")}
            className={`flex-1 py-2.5 text-sm font-medium text-center ${tab === "trends" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
            <TrendingUp size={14} className="inline mr-1"/>Trends</button>
        </div>

        {tab === "programs" ? programsContent : trendsContent}
      </div>
    </div>
  )
}