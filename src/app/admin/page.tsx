"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Dumbbell, Users, FileText, TrendingUp, LogOut, Menu, X, Activity, AlertTriangle } from "lucide-react"
import { getUser, authFetch, logout } from "@/lib/client-auth"

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setUser(getUser())
    if (!getUser()) window.location.href = "/admin/login"
    authFetch("/api/admin/dashboard").then(r => r.json()).then(setData)
  }, [])

  const handleLogout = () => { logout(); window.location.href = "/admin/login" }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <h1 className="font-bold text-lg text-blue-600">MR Coaching</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.name}</span>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500"><LogOut size={18} /></button>
        </div>
      </header>
      <div className="p-4 max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4"><div className="text-2xl font-bold text-blue-600">{data?.clientCount ?? "—"}</div><div className="text-sm text-gray-500">Clients</div></div>
          <div className="bg-white rounded-xl border p-4"><div className="text-2xl font-bold text-green-600">{data?.activePrograms ?? "—"}</div><div className="text-sm text-gray-500">Active Programs</div></div>
          <div className="bg-white rounded-xl border p-4"><div className="text-2xl font-bold text-purple-600">{data?.totalExercises ?? "—"}</div><div className="text-sm text-gray-500">Exercises</div></div>
          <div className="bg-white rounded-xl border p-4"><div className="text-2xl font-bold text-teal-600">{data?.activeClientCount ?? "—"}</div><div className="text-sm text-gray-500">Logged This Week</div></div>
        </div>

        {/* Progress widget */}
        {data?.staleClientCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-amber-800 mb-2">
              <AlertTriangle size={18} />
              <h3 className="font-medium text-sm">{data.staleClientCount} client{data.staleClientCount !== 1 ? "s" : ""} haven&apos;t logged in 14+ days</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.staleClients.map((name: string) => (
                <span key={name} className="text-xs bg-white px-2.5 py-1 rounded-full border border-amber-200 text-amber-700">{name}</span>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border p-4 mb-6">
          <h3 className="font-medium text-sm mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-2">
            <Link href="/admin/exercises/new" className="flex flex-col items-center gap-1.5 px-3 py-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Dumbbell size={20} /> <span>Exercise</span></Link>
            <Link href="/admin/clients/new" className="flex flex-col items-center gap-1.5 px-3 py-3 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"><Users size={20} /> <span>Client</span></Link>
            <Link href="/admin/programs/new" className="flex flex-col items-center gap-1.5 px-3 py-3 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"><FileText size={20} /> <span>Program</span></Link>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <h3 className="font-medium text-sm mb-3">Recent Clients</h3>
          {data?.recentClients?.length ? data.recentClients.map((c: any) => (
            <Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
              <span className="text-sm font-medium">{c.name}</span>
              <span className="text-xs text-gray-400">{c.programCount} program{c.programCount !== 1 ? "s" : ""}</span>
            </Link>
          )) : <p className="text-sm text-gray-400">No clients yet.</p>}
        </div>
      </div>
    </div>
  )
}