"use client"

import { useEffect, useState } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import { Dumbbell, Users, FileText, LogOut, TrendingUp, Menu, X } from "lucide-react"

const NAV = [
  { href: "/admin", label: "Dashboard", icon: TrendingUp },
  { href: "/admin/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/programs", label: "Programs", icon: FileText },
]

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(s => setUser(s?.user))
    fetch("/api/admin/dashboard").then(r => r.json()).then(setData)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <h1 className="font-bold text-lg text-blue-600">MR Coaching</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">{user?.name}</span>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="p-2 text-gray-400 hover:text-red-500"><LogOut size={18} /></button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-400 md:hidden">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </header>
      {menuOpen && (
        <div className="md:hidden bg-white border-b">
          {NAV.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 border-b">{<item.icon size={18} className="text-gray-400" />} {item.label}</Link>
          ))}
        </div>
      )}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-56 md:flex-col md:pt-14">
        <nav className="flex-1 bg-white border-r px-3 py-4 space-y-1">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">
              {<item.icon size={18} />} {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="md:ml-56 p-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border p-4"><div className="text-2xl font-bold text-blue-600">{data?.clientCount ?? "—"}</div><div className="text-sm text-gray-500">Clients</div></div>
            <div className="bg-white rounded-xl border p-4"><div className="text-2xl font-bold text-green-600">{data?.activePrograms ?? "—"}</div><div className="text-sm text-gray-500">Active Programs</div></div>
            <div className="bg-white rounded-xl border p-4"><div className="text-2xl font-bold text-purple-600">{data?.totalExercises ?? "—"}</div><div className="text-sm text-gray-500">Exercises</div></div>
          </div>
          <div className="bg-white rounded-xl border p-4 mb-6">
            <h3 className="font-medium text-sm mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin/exercises/new" className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"><Dumbbell size={16} /> New Exercise</Link>
              <Link href="/admin/clients/new" className="inline-flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"><Users size={16} /> New Client</Link>
              <Link href="/admin/programs/new" className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700"><FileText size={16} /> New Program</Link>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-medium text-sm mb-3">Clients</h3>
            {data?.recentClients?.length ? data.recentClients.map((c: any) => (
              <Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-gray-400">{c.programCount} program{c.programCount !== 1 ? "s" : ""}</span>
              </Link>
            )) : <p className="text-sm text-gray-400">No clients yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}