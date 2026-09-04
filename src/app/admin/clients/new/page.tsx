"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, UserPlus } from "lucide-react"

export default function NewClientPage() {
  const router = useRouter()
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [saving,setSaving]=useState(false)

  const handleSubmit=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);const res=await fetch("/api/clients",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,password})});if(res.ok)router.push("/admin/clients");else{const d=await res.json();alert(d.error||"Failed");setSaving(false)}}

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-50 px-4 h-14 flex items-center"><div className="flex items-center gap-3"><Link href="/admin/clients" className="p-1 hover:bg-gray-100"><ArrowLeft size={20} className="text-gray-500"/></Link><h1 className="font-semibold">New Client</h1></div></header>
      <div className="p-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-4 space-y-4">
          <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required/></div>
          <div><label className="block text-sm font-medium mb-1">Email *</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" required/></div>
          <div><label className="block text-sm font-medium mb-1">Password *</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} className="w-full px-3 py-2 border rounded-lg text-sm" required/><p className="text-xs text-gray-400 mt-1">Client uses this to log in</p></div>
          <button type="submit" disabled={saving||!name||!email||!password} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"><UserPlus size={16}/>{saving?"Creating...":"Create"}</button>
        </form>
      </div>
    </div>
  )
}