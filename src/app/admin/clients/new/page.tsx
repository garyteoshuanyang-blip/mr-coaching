"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, UserPlus } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

export default function NewClientPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [slugPreview, setSlugPreview] = useState("")

  const updateSlugPreview = (v: string) => {
    setName(v)
    setSlugPreview(v.toLowerCase().replace(/\s+/g, ""))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError("")
    const res = await authFetch("/api/clients", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
    if (res.ok) router.push("/admin/clients")
    else { const d = await res.json(); setError(d.error || "Failed"); setSaving(false) }
  }

  if (typeof window !== "undefined" && !getUser()) window.location.href = "/admin/login"

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href="/admin/clients" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">New Client</h1></div></header>
      <div className="p-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-4 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Client Name *</label>
            <input type="text" value={name} onChange={e => updateSlugPreview(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required placeholder="e.g. Tim Ng" autoFocus />
            {name && <p className="text-xs text-gray-400 mt-1">Slug: <span className="text-blue-600 font-medium">{slugPreview}</span></p>}
          </div>
          <button type="submit" disabled={saving || !name} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"><UserPlus size={16}/>{saving ? "Creating..." : "Create Client"}</button>
        </form>
      </div>
    </div>
  )
}