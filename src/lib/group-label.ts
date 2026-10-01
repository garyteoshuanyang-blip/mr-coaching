/** 0 -> "A", 25 -> "Z", 26 -> "AA". Safe to import from client components. */
export function groupLabel(i: number): string {
  let s = ""
  let n = i
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}
