"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Plus, Edit3, Check, X, Copy } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

export default function ClientDetailPage() {
  const params = useParams(); const router = useRouter()
  const [data, setData] = useState<any>(null); const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false); const [editName, setEditName] = useState(""); const [editSlug, setEditSlug] = useState("")
  const [saving, setSaving] = useState(false); const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!getUser()) window.location.href = "/admin/login"
    authFetch(`/api/clients/${params.id}`).then(r => r.json()).then(d => { setData(d); setEditName(d.name); setEditSlug(d.clientSlug || ""); setLoading(false) })
  }, [params.id])

  const handleDelete = async () => { if (!confirm("Delete this client and all their data?")) return; await authFetch(`/api/clients/${params.id}`, { method: "DELETE" }); router.push("/admin/clients") }

  const handleSave = async () => {
    setSaving(true)
    const res = await authFetch(`/api/clients/${params.id}`, { method: "PATCH", body: JSON.stringify({ name: editName, clientSlug: editSlug }) })
    if (res.ok) { setEditing(false); const d = await res.json(); setData((prev: any) => ({ ...prev, name: d.client.name, clientSlug: d.client.clientSlug })); }
    else { const d = await res.json(); alert(d.error || "Failed") }
    setSaving(false)
  }

  const copySlug = () => { navigator.clipboard.writeText(data.clientSlug); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>
  if (!data) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Not found</p></div>

  const bw = data.bodyWeightLogs || []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3"><Link href="/admin/clients" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">{data.name}</h1></div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditing(!editing); if (!editing) { setEditName(data.name); setEditSlug(data.clientSlug || "") } }} className="p-2 text-gray-400 hover:text-blue-600"><Edit3 size={18}/></button>
          <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
        </div>
      </header>
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Info card */}
        <div className="bg-white rounded-xl border p-4">
          {editing ? (
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Name</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Client Slug (unique ID for login)</label><input type="text" value={editSlug} onChange={e => setEditSlug(e.target.value.toLowerCase().replace(/\s+/g, ""))} className="w-full px-3 py-2 border rounded-lg text-sm"/></div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"><Check size={14}/>{saving ? "Saving..." : "Save"}</button>
                <button onClick={() => setEditing(false)} className="text-gray-500 px-3 py-1.5 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">{data.clientSlug ? `${data.clientSlug}` : "No slug set"}</p>
              {data.clientSlug && (
                <button onClick={copySlug} className="text-xs flex items-center gap-1 mt-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-500">
                  <Copy size={12}/> {copied ? "Copied!" : "Copy login slug"}
                </button>
              )}
              {bw.length > 0 && <p className="text-sm mt-2">Last weight: <span className="font-medium">{bw[0].weight} kg</span></p>}
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Programs</h2>
          <Link href={`/admin/programs/assign?clientId=${params.id}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus size={14}/>Assign</Link>
        </div>
        {data.assignedPrograms?.length > 0 ? <div className="space-y-2">{data.assignedPrograms.map((p: any) => (
          <Link key={p.id} href={`/admin/programs/${p.id}`} className="flex items-center justify-between bg-white rounded-lg border p-4 hover:shadow-sm">
            <div><p className="font-medium text-sm">{p.name}</p><p className="text-xs text-gray-400 capitalize">{p.status} · {p.weeks?.length || 0} weeks</p></div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{p.status}</span>
          </Link>
        ))}</div> : <p className="text-sm text-gray-400">No programs assigned.</p>}
      </div>
    </div>
  )
}