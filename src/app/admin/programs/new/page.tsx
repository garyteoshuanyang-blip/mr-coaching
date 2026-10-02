"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ProgramBuilder from "@/components/ProgramBuilder"

function NewProgramForm() {
  const searchParams = useSearchParams()
  const clientId = searchParams.get("clientId")
  return (
    <ProgramBuilder
      clientId={clientId}
      heading={`New Program${clientId ? " for Client" : ""}`}
    />
  )
}

export default function NewProgramPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>}>
      <NewProgramForm />
    </Suspense>
  )
}
