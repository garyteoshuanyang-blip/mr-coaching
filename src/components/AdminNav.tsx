"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, Users, FileText, TrendingUp } from "lucide-react"

const NAV = [
  { href: "/admin", label: "Dashboard", icon: TrendingUp },
  { href: "/admin/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/programs", label: "Programs", icon: FileText },
]

export default function AdminNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {NAV.map(item => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-16 min-h-[44px] px-2 ${
                  active ? "text-blue-600" : "text-gray-400"
                }`}>
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-56 md:flex-col md:z-40">
        <div className="flex-1 bg-white border-r mt-14 px-3 py-4 space-y-1">
          {NAV.map(item => {
            const active = isActive(item.href)
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  active ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                }`}>
                <item.icon size={18} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}