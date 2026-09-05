// Client-side JWT helpers — uses localStorage like Pixel Plates

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("mr_token")
}

export function getUser(): { id: string; name: string; role: string; clientSlug?: string } | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("mr_user")
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function logout() {
  localStorage.removeItem("mr_token")
  localStorage.removeItem("mr_user")
}

export function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
}

export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = { ...authHeaders(), ...(options.headers || {}) }
  return fetch(url, { ...options, headers })
}

export function requireAuth(redirectTo: string): boolean {
  const token = getToken()
  if (!token && typeof window !== "undefined") {
    window.location.href = redirectTo
    return false
  }
  return true
}