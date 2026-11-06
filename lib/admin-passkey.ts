import "server-only"

const configuredPasskey = process.env.ADMIN_MEMBER_CHANGE_PASSKEY
const ADMIN_MEMBER_CHANGE_PASSKEY = configuredPasskey && /^\d{4}$/.test(configuredPasskey)
  ? configuredPasskey
  : "9347"

export function isValidAdminMemberPasskey(value: unknown): value is string {
  return typeof value === "string" && value === ADMIN_MEMBER_CHANGE_PASSKEY
}
