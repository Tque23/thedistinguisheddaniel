import { timingSafeEqual } from "node:crypto"

const attempts = new Map<string, { count: number; resetAt: number }>()

/** Best-effort edge-safe guard for abuse bursts. Use a shared limiter for multi-instance deployments. */
export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }
  current.count += 1
  return { allowed: current.count <= limit, retryAfter: Math.ceil((current.resetAt - now) / 1000) }
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function constantTimeEqual(left: string, right: string) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && timingSafeEqual(a, b)
}
