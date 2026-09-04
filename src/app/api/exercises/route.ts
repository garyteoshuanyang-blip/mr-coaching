import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const exercises = await db.exercise.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json({ exercises })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, muscleGroup, equipment, description } = await req.json()
  if (!name || !muscleGroup) return NextResponse.json({ error: "Name and muscle group required" }, { status: 400 })
  const exercise = await db.exercise.create({ data: { name, muscleGroup, equipment, description } })
  return NextResponse.json({ exercise }, { status: 201 })
}