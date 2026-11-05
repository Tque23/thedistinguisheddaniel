# Next.js Project

## Getting Started

Run the development server:

```bash
npm run dev
```

## Supabase dashboard integration

Apply the migrations in `supabase/migrations` to the existing Supabase project before deploying. The directory migration adds `member_profiles.directory_visible`, limits directory reads to approved profiles, and prevents members from granting themselves paid-course access.

The initial administrator bootstrap endpoint requires the server-only `ADMIN_BOOTSTRAP_TOKEN` and `ADMIN_BOOTSTRAP_EMAIL` environment variables. Set both only in trusted deployment environments; send the token as a Bearer authorization header and provide the matching email plus a password of at least 12 characters in the request body. Normal admin pages and actions use the server-managed `app_metadata.is_admin` claim.

Supabase table definitions used by the application are described in `lib/supabase/database.types.ts`. Keep those types aligned with the project's schema when adding or changing columns.
