import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getAuthUser, unauth } from "@/lib/auth-utils"
import { DAY_INCLUDE } from "@/lib/program-groups"
import { computeEditImpact, diffApplyWeeks } from "@/lib/program-update"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user) return unauth()

  // 🔴 Whose workout logs get attached? The PROGRAM'S CLIENT — never the viewer.
  // This used to filter on `user.id`, so an admin (who never logs workouts)
  // always received zero logs: the program page's progress bar read 0% and no
  // logged weights were available anywhere on the screen. It only looked
  // correct when a client opened their own program, which is why it hid.
  const owner = await db.program.findUnique({ where: { id }, select: { clientId: true } })
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (user.role === "client" && owner.clientId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // Templates (clientId null) have no client, so attach no logs.
  const logClientId = owner.clientId ?? "__template__"

  const program = await db.program.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { dayOrder: "asc" },
            include: {
              groups: { orderBy: { sortOrder: "asc" } },
              exercises: {
                include: { exercise: true, logs: { where: { clientId: logClientId }, orderBy: { date: "desc" }, take: 3 } },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
  })
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(program)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  const body = await req.json()
  const { name, description, status, weeks, confirmDeleteLogs } = body

  // No structure in the payload → legacy metadata-only update (unchanged behaviour).
  if (!Array.isArray(weeks)) {
    const program = await db.program.update({ where: { id }, data: { name, description, status } })
    return NextResponse.json({ program })
  }

  // Guard: refuse an edit that would delete logged history unless confirmed.
  if (!confirmDeleteLogs) {
    const impact = await computeEditImpact(id, weeks)
    if (impact.logsToDelete > 0) {
      return NextResponse.json(
        { error: "would_delete_logs", logsToDelete: impact.logsToDelete },
        { status: 409 }
      )
    }
  }

  await db.program.update({ where: { id }, data: { name, description, status } })
  await diffApplyWeeks(id, weeks)

  const program = await db.program.findUnique({
    where: { id },
    include: { weeks: { orderBy: { weekNumber: "asc" }, include: { days: DAY_INCLUDE } } },
  })
  return NextResponse.json({ program })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getAuthUser(req)
  if (!user || user.role !== "admin") return unauth()
  await db.program.delete({ where: { id } })
  return NextResponse.json({ success: true })
}