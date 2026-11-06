export type AuthRequestResult =
  | { ok: true; message?: string; changedAt?: string }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function requestAuth(payload: Record<string, string>): Promise<AuthRequestResult> {
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const result: unknown = await response.json()
    if (isRecord(result) && result.ok === true) {
      return {
        ok: true,
        message: typeof result.message === "string" ? result.message : undefined,
        changedAt: typeof result.changedAt === "string" ? result.changedAt : undefined,
      }
    }
    return {
      ok: false,
      error: isRecord(result) && typeof result.error === "string"
        ? result.error
        : "Unable to complete your request. Please try again.",
    }
  } catch {
    return { ok: false, error: "Unable to connect. Please try again." }
  }
}
