import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createToken } from "@/lib/auth-utils"

export async function POST(req: Request) {
  const { email, password } = await req.json()
  if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 })

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !user.hashedPassword) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

  const bcrypt = (await import("bcryptjs")).default
  const valid = await bcrypt.compare(password, user.hashedPassword)
  if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })

  if (user.role !== "admin") return NextResponse.json({ error: "Not authorized" }, { status: 403 })

  const token = await createToken({ id: user.id, name: user.name, role: "admin" })

  return NextResponse.json({
    token, user: { id: user.id, name: user.name, role: user.role },
  })
}