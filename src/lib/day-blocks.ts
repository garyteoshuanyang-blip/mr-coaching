import { groupLabel } from "@/lib/group-label"

export type DayBlock =
  | { kind: "single"; ex: any }
  | { kind: "group"; label: string; restAfterSec: number | null; members: any[] }

/**
 * Group a day's exercises into render blocks, preserving the original exercise order.
 * Works with both shapes:
 *   - server rows:   ex.groupId + day.groups[{ id, label, restAfterSec }]
 *   - builder state: ex.groupKey + day.groups[{ key, restAfterSec }]  (label derived)
 */
export function buildDayBlocks(day: any): DayBlock[] {
  const exercises: any[] = day?.exercises || []
  const groups: any[] = day?.groups || []

  const keyed = new Map<string, any[]>()
  for (const ex of exercises) {
    const key = ex.groupId ?? ex.groupKey ?? null
    if (!key) continue
    if (!keyed.has(key)) keyed.set(key, [])
    keyed.get(key)!.push(ex)
  }

  const blocks: DayBlock[] = []
  const emitted = new Set<string>()
  for (const ex of exercises) {
    const key = ex.groupId ?? ex.groupKey ?? null
    if (!key) { blocks.push({ kind: "single", ex }); continue }
    if (emitted.has(key)) continue
    emitted.add(key)
    const members = keyed.get(key)!
    if (members.length < 2) { members.forEach(m => blocks.push({ kind: "single", ex: m })); continue }
    const idx = groups.findIndex((g: any) => (g.id ?? g.key) === key)
    const g = idx >= 0 ? groups[idx] : null
    blocks.push({
      kind: "group",
      label: g?.label ?? groupLabel(idx < 0 ? 0 : idx),
      restAfterSec: g?.restAfterSec ?? null,
      members,
    })
  }
  return blocks
}

export const fmtRest = (s: number | null | undefined) => {
  if (!s) return ""
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r ? `${m}m${r}s` : `${m}m`
}
