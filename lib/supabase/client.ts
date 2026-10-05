import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const isExampleMode = process.env.NEXT_PUBLIC_EXAMPLE_MODE === "true"
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // In example mode, return a mock client that won't throw errors
  if (isExampleMode || !supabaseUrl || !supabaseKey) {
    return {
      auth: {
        signInWithPassword: async () => ({ data: null, error: { message: "Example mode - no real authentication" } }),
        signUp: async () => ({ data: null, error: { message: "Example mode - no real authentication" } }),
        signOut: async () => ({ error: null }),
        resetPasswordForEmail: async () => ({ data: null, error: null }),
        updateUser: async () => ({ data: null, error: { message: "Example mode - no real authentication" } }),
        getUser: async () => ({ data: { user: null }, error: null }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: { message: "Example mode - no real database" } }),
        update: () => ({ data: null, error: { message: "Example mode - no real database" } }),
        delete: () => ({ data: null, error: { message: "Example mode - no real database" } }),
      }),
    } as any
  }

  return createBrowserClient(supabaseUrl, supabaseKey)
}
