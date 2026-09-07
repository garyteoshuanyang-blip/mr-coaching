"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

export default function ClientLinkPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState("Redirecting...")

  useEffect(() => {
    const slug = params.slug as string
    if (!slug) {
      setStatus("Invalid link")
      return
    }

    fetch("/api/auth/client-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          localStorage.setItem("mr_token", data.token)
          localStorage.setItem("mr_user", JSON.stringify(data.user))
          router.push("/client")
        } else {
          setStatus("Client not found — check your link with your coach")
        }
      })
      .catch(() => setStatus("Something went wrong"))
  }, [params.slug, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500 text-sm">{status}</p>
      </div>
    </div>
  )
}