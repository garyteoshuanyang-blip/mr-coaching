import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const exercise = await db.exercise.findUnique({ where: { id } })
  if (!exercise) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(exercise)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { name, muscleGroup, equipment, description } = await req.json()
  const exercise = await db.exercise.update({ where: { id }, data: { name, muscleGroup, equipment, description } })
  return NextResponse.json({ exercise })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await db.exercise.delete({ where: { id } })
  return NextResponse.json({ success: true })
}