import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"

export async function GET(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const exercises = await db.exercise.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json({ exercises })
}

export async function POST(req: Request) {
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const { name, muscleGroup, equipment, description } = await req.json()
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })
  const exercise = await db.exercise.create({ data: { name, muscleGroup, equipment, description } })
  return NextResponse.json({ exercise }, { status: 201 })
}