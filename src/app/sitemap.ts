import type { MetadataRoute } from "next"

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://distinguisheddaniel.com").replace(/\/$/, "")

const publicRoutes = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/events", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/get-involved", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/institute", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/network", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return publicRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}

export const revalidate = 3600
export const dynamic = "force-static"

// Only canonical public routes belong in this sitemap. Authenticated/admin routes are excluded.
