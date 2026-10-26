import { NextResponse } from "next/server"
import { constantTimeEqual, rateLimit } from "@/lib/security"

/**
 * Account provisioning is deliberately disabled unless an operator supplies a
 * one-time server secret. Hard-coded credentials in a public route are a
 * complete administrative takeover vulnerability.
 */
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  const limited = rateLimit(`bootstrap:${ip}`, 3, 15 * 60_000)
  const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET
  const suppliedSecret = request.headers.get("x-admin-bootstrap-secret") || ""
  if (!limited.allowed || !configuredSecret || !constantTimeEqual(suppliedSecret, configuredSecret)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ error: "Bootstrap must be performed through a private operator workflow." }, { status: 410 })
}
