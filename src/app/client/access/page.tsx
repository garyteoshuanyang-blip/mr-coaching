"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ClientAccessPage() {
  const [slug, setSlug] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError("")
    const res = await fetch("/api/auth/client-login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
    const data = await res.json()
    if (!res.ok) { setError("Client not found — check with your coach"); setLoading(false); return }
    localStorage.setItem("mr_token", data.token)
    localStorage.setItem("mr_user", JSON.stringify(data.user))
    router.push("/client")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">MR Coaching</h1>
          <p className="text-gray-500 mt-1">Enter your name to access your programs</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
              placeholder="Your name (e.g. timng)"
              className="w-full px-3 py-3 border rounded-lg text-base text-center focus:ring-2 focus:ring-blue-500"
              autoFocus required />
          </div>
          <button type="submit" disabled={loading || !slug.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-base hover:bg-blue-700 disabled:opacity-50">
            {loading ? "One moment..." : "Access My Programs"}
          </button>
        </form>
      </div>
    </div>
  )
}