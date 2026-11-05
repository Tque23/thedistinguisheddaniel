import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

export function createAdminClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
