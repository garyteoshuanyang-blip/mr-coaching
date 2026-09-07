"use client"

import { usePathname } from "next/navigation"
import AdminNav from "@/components/AdminNav"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin = pathname === "/admin/login"
  const showNav = !isLogin

  return (
    <>
      {showNav && <AdminNav />}
      <div className={showNav ? "md:ml-56" : ""}>
        {children}
      </div>
      {showNav && <div className="h-16 md:hidden" />}
    </>
  )
}