"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Search, ArrowLeft } from "lucide-react"
import { getUser, authFetch } from "@/lib/client-auth"

export default function ExerciseListPage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (!getUser()) window.location.href = "/admin/login"; authFetch("/api/exercises").then(r => r.json()).then(d => { setExercises(d.exercises || []); setLoading(false) }) }, [])

  const filtered = exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.muscleGroup.toLowerCase().includes(search.toLowerCase()))
  const muscleGroups = [...new Set(exercises.map(e => e.muscleGroup))].sort()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3"><Link href="/admin" className="p-1 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} className="text-gray-500" /></Link><h1 className="font-semibold">Exercise Library</h1></div>
        <Link href="/admin/exercises/new" className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"><Plus size={16} /> Add</Link>
      </header>
      <div className="p-4 max-w-4xl mx-auto">
        <div className="relative mb-4"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" /></div>
        <div className="flex flex-wrap gap-1.5 mb-4">{muscleGroups.map(mg => (
          <button key={mg} onClick={() => setSearch(mg)} className={`px-2.5 py-1 rounded-full text-xs ${search === mg ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"}`}>{mg}</button>
        ))}</div>
        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="bg-white rounded-lg border p-4 animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/3" /></div>)}</div>
          : filtered.length === 0 ? <div className="text-center py-12"><p className="text-gray-400">No exercises found</p></div>
          : <div className="space-y-2">{filtered.map(ex => (
              <Link key={ex.id} href={`/admin/exercises/${ex.id}/edit`} className="flex items-center justify-between bg-white rounded-lg border p-4 hover:shadow-sm">
                <div><p className="font-medium text-sm">{ex.name}</p><p className="text-xs text-gray-400 capitalize">{ex.muscleGroup}{ex.equipment ? ` · ${ex.equipment}` : ""}</p></div>
                <div className="text-xs text-gray-300">Edit</div>
              </Link>
            ))}</div>}
      </div>
    </div>
  )
}