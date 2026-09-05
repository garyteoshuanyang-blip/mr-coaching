"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, Dumbbell, FileText, LogOut, TrendingUp, Menu, X } from "lucide-react"
import { getUser, authFetch, logout } from "@/lib/client-auth"

const NAV = [
  { href: "/client", label: "Dashboard", icon: Activity },
  { href: "/client/programs", label: "My Programs", icon: FileText },
  { href: "/client/progress", label: "Progress", icon: TrendingUp },
]

export default function ClientDashboard() {
  const [data, setData] = useState<any>(null); const [user, setUser] = useState<any>(null); const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (!u) window.location.href = "/client/access"
    setUser(u)
    authFetch("/api/client/dashboard").then(r => r.json()).then(setData)
  }, [])

  const handleLogout = () => { logout(); window.location.href = "/client/access" }
  const today = new Date().toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "short" })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center justify-between">
        <h1 className="font-bold text-lg text-blue-600">MR Coaching</h1>
        <div className="flex items-center gap-3"><span className="text-sm text-gray-500 hidden sm:block">{user?.name}</span>
          <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500"><LogOut size={18}/></button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-400 md:hidden">{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button></div>
      </header>
      {menuOpen && <div className="md:hidden bg-white border-b">{NAV.map(item => <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 border-b">{<item.icon size={18} className="text-gray-400"/>}{item.label}</Link>)}</div>}
      <div className="p-4 max-w-2xl mx-auto">
        <p className="text-sm text-gray-500">{today}</p>
        <h2 className="text-xl font-semibold mt-1">Welcome back, {user?.name || "Client"}!</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-white rounded-xl border p-3"><div className="text-xl font-bold text-blue-600">{data?.activePrograms ?? "—"}</div><div className="text-xs text-gray-500">Active</div></div>
          <div className="bg-white rounded-xl border p-3"><div className="text-xl font-bold text-green-600">{data?.todayWorkouts ?? "—"}</div><div className="text-xs text-gray-500">Today</div></div>
          <div className="bg-white rounded-xl border p-3"><div className="text-xl font-bold text-purple-600">{data?.totalPrograms ?? "—"}</div><div className="text-xs text-gray-500">Programs</div></div>
          <div className="bg-white rounded-xl border p-3"><div className="text-xl font-bold text-yellow-600">{data?.lastWeight ? `${data.lastWeight}kg` : "—"}</div><div className="text-xs text-gray-500">Weight</div></div>
        </div>
        <div className="bg-white rounded-xl border p-4 mb-6">
          <h3 className="font-medium text-sm mb-2">⚖️ Log Body Weight</h3>
          <form onSubmit={async(e) => { e.preventDefault(); const f = e.target as HTMLFormElement; const w = parseFloat((f.elements.namedItem("weight") as HTMLInputElement).value); if (!w) return; await authFetch("/api/body-weight", { method: "POST", body: JSON.stringify({ weight: w }) }); window.location.reload() }} className="flex gap-2">
            <input type="number" name="weight" step="0.1" placeholder="Weight (kg)" required className="flex-1 px-3 py-2 border rounded-lg text-sm"/>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Log</button>
          </form>
        </div>
        <div className="space-y-2">
          <Link href="/client/programs" className="flex items-center justify-between bg-white rounded-xl border p-4 hover:shadow-sm">
            <div className="flex items-center gap-3"><Dumbbell size={20} className="text-blue-500"/><div><p className="font-medium text-sm">My Programs</p><p className="text-xs text-gray-400">{data?.activePrograms ?? 0} active</p></div></div>
            <span className="text-xs text-gray-300">View →</span>
          </Link>
          <Link href="/client/progress" className="flex items-center justify-between bg-white rounded-xl border p-4 hover:shadow-sm">
            <div className="flex items-center gap-3"><TrendingUp size={20} className="text-green-500"/><div><p className="font-medium text-sm">Progress</p><p className="text-xs text-gray-400">Body weight chart</p></div></div>
            <span className="text-xs text-gray-300">View →</span>
          </Link>
        </div>
      </div>
    </div>
  )
}