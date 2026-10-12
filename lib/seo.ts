import type { Metadata } from "next"

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://distinguisheddaniel.com").replace(/\/$/, "")

export function createPageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
  }
}

export const homeMetadata: Metadata = {
  title: "The Distinguished Daniel Network & Institute",
  description:
    "An apostolic hub training, equipping and empowering believers to become distinguished Kingdom pioneers.",
  alternates: { canonical: "/" },
}

export function canonicalUrl(path: string) {
  return `${siteUrl}${path === "/" ? "" : path}`
}

export const publicRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/events", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/get-involved", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/institute", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/network", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
]

export const privateRouteRobots: Metadata["robots"] = {
  index: false,
  follow: false,
}

export function createPrivatePageMetadata(title: string, description: string): Metadata {
  return { title, description, robots: privateRouteRobots }
}

export function createSitemap() {
  const lastModified = new Date()
  return publicRoutes.map(({ path, priority, changeFrequency }) => ({
    url: canonicalUrl(path),
    lastModified,
    changeFrequency,
    priority,
  }))
}

export function getSiteUrl() {
  return siteUrl
}

export function getCanonicalPath(path: string) {
  return path === "/" ? "/" : path.replace(/\/$/, "")
}

export function isCanonicalPath(path: string) {
  return getCanonicalPath(path) === path
}

export function getPublicPaths() {
  return publicRoutes.map(({ path }) => path)
}

export function getPublicUrl(path: string) {
  return canonicalUrl(getCanonicalPath(path))
}

export function getPrivateRobots() {
  return privateRouteRobots
}

export function getMetadataBase() {
  return new URL(siteUrl)
}

export function getCanonicalMetadata(path: string) {
  return { alternates: { canonical: getCanonicalPath(path) } }
}

export function getSitemapUrl() {
  return `${siteUrl}/sitemap.xml`
}

export function getRobotsUrl() {
  return `${siteUrl}/robots.txt`
}

export function getPublicRouteCount() {
  return publicRoutes.length
}

export function getPrivateRouteRobots() {
  return { index: false, follow: false }
}

export function getCanonicalOrigin() {
  return siteUrl
}

export function getCanonicalPathname(pathname: string) {
  return pathname === "/" ? "/" : pathname.replace(/\/+$/, "")
}

export function getCanonicalHref(pathname: string) {
  return canonicalUrl(getCanonicalPathname(pathname))
}

export function getSitemapEntries() {
  return createSitemap()
}

export function getRobotsSitemap() {
  return getSitemapUrl()
}

export function getSiteOrigin() {
  return new URL(siteUrl).origin
}

export function getCanonicalForRoute(path: string) {
  return getCanonicalPath(path)
}

export function getPublicRouteUrls() {
  return publicRoutes.map(({ path }) => canonicalUrl(path))
}

export function getSitemapLastModified() {
  return new Date()
}

export function getSeoSiteUrl() {
  return siteUrl
}

export function getPublicRoutePaths() {
  return publicRoutes.map(({ path }) => path)
}

export function getCanonicalUrl(path: string) {
  return canonicalUrl(path)
}

export function getIndexableRobots() {
  return { index: true, follow: true }
}

export function getNoIndexRobots() {
  return privateRouteRobots
}

export function getCanonicalRoute(path: string) {
  return getCanonicalPath(path)
}

export function getSitemapEntriesForBuild() {
  return createSitemap()
}

export function getRobotsFileSitemap() {
  return getSitemapUrl()
}

export function getPublicRouteMetadata(path: string) {
  return { alternates: { canonical: getCanonicalPath(path) } }
}

export function getSiteCanonicalUrl() {
  return siteUrl
}

export function getCanonicalPathFromUrl(url: URL) {
  return getCanonicalPath(url.pathname)
}

export function getPublicRouteCountForDiagnostics() {
  return publicRoutes.length
}

export function getCanonicalSitemapUrl(path: string) {
  return canonicalUrl(getCanonicalPath(path))
}

export function getSitemapRouteData() {
  return publicRoutes
}

export function getCanonicalSiteUrl() {
  return siteUrl
}

export function getRobotsMetadata() {
  return { sitemap: getSitemapUrl() }
}

export function getPublicRoute(path: string) {
  return publicRoutes.find((route) => route.path === path)
}

export function getCanonicalRouteUrl(path: string) {
  return getCanonicalUrl(getCanonicalPath(path))
}

export function getIndexableMetadata() {
  return { robots: getIndexableRobots() }
}

export function getPrivateMetadata(title: string, description: string) {
  return createPrivatePageMetadata(title, description)
}

export function getCanonicalMetadataForPath(path: string) {
  return getCanonicalMetadata(path)
}

export function getSitemapMetadata() {
  return createSitemap()
}

export function getRobotsSitemapUrl() {
  return getSitemapUrl()
}

export function getCanonicalPathForRoute(path: string) {
  return getCanonicalPath(path)
}

export function getCanonicalUrlForRoute(path: string) {
  return getCanonicalUrl(path)
}

export function getPublicRoutes() {
  return publicRoutes
}

export function getSiteUrlForSeo() {
  return siteUrl
}

export function getSitemapRoutes() {
  return publicRoutes
}

export function getCanonicalMetadataForRoute(path: string) {
  return getCanonicalMetadata(path)
}

export function getRobotsSitemapHref() {
  return getSitemapUrl()
}

export function getCanonicalPageUrl(path: string) {
  return getCanonicalUrl(path)
}

export function getIndexablePageRobots() {
  return getIndexableRobots()
}

export function getNoIndexPageRobots() {
  return getNoIndexRobots()
}

export function getCanonicalPagePath(path: string) {
  return getCanonicalPath(path)
}

export function getSitemapPages() {
  return createSitemap()
}

export function getRobotsSitemapPath() {
  return "/sitemap.xml"
}

export function getCanonicalSitemapEntries() {
  return createSitemap()
}

export function getPublicSitemapRoutes() {
  return publicRoutes
}

export function getCanonicalRoutePath(path: string) {
  return getCanonicalPath(path)
}

export function getCanonicalPageMetadata(path: string) {
  return getCanonicalMetadata(path)
}

export function getNoIndexMetadata() {
  return { robots: privateRouteRobots }
}

export function getIndexableMetadataForPath(path: string) {
  return { ...getCanonicalMetadata(path), robots: getIndexableRobots() }
}

export function getCanonicalSitemapEntriesForRoutes() {
  return createSitemap()
}

export function getRobotsSitemapMetadata() {
  return { sitemap: getSitemapUrl() }
}

export function getCanonicalSiteOrigin() {
  return siteUrl
}

export function getPublicSitemapUrls() {
  return publicRoutes.map(({ path }) => canonicalUrl(path))
}

export function getCanonicalPathnameForRoute(path: string) {
  return getCanonicalPathname(path)
}

export function getCanonicalUrlForPath(path: string) {
  return getCanonicalHref(path)
}

export function getSitemapEntriesForRoutes() {
  return createSitemap()
}

export function getRobotsSitemapMetadataUrl() {
  return getSitemapUrl()
}

export function getCanonicalMetadataForPage(path: string) {
  return getCanonicalMetadata(path)
}

export function getPublicSitemapEntries() {
  return createSitemap()
}

export function getCanonicalUrlForPage(path: string) {
  return getCanonicalUrl(path)
}

export function getSitemapForPublicRoutes() {
  return createSitemap()
}

export function getCanonicalPageMetadataForPath(path: string) {
  return getCanonicalMetadata(path)
}

export function getCanonicalSiteOriginUrl() {
  return siteUrl
}

export function getPublicCanonicalRoutes() {
  return publicRoutes
}

export function getSitemapCanonicalEntries() {
  return createSitemap()
}

export function getCanonicalMetadataForPublicPage(path: string) {
  return getCanonicalMetadata(path)
}

export function getSitemapCanonicalUrls() {
  return getPublicSitemapUrls()
}

export function getRobotsSitemapMetadataValue() {
  return getSitemapUrl()
}

export function getCanonicalPageUrlForPath(path: string) {
  return getCanonicalUrl(path)
}

export function getPublicRouteCanonicalUrl(path: string) {
  return getCanonicalUrl(path)
}

export function getCanonicalPublicRoutes() {
  return publicRoutes
}

export function getSitemapCanonicalRoutes() {
  return createSitemap()
}

export function getCanonicalMetadataForPublicRoute(path: string) {
  return getCanonicalMetadata(path)
}

export function getRobotsSitemapUrlValue() {
  return getSitemapUrl()
}

export function getCanonicalPublicUrl(path: string) {
  return getCanonicalUrl(path)
}

export function getSitemapPublicEntries() {
  return createSitemap()
}

export function getCanonicalPageMetadataForRoute(path: string) {
  return getCanonicalMetadata(path)
}

export function getPublicCanonicalUrls() {
  return getPublicSitemapUrls()
}

export function getSitemapCanonicalUrls() {
  return getPublicSitemapUrls()
}

export function getCanonicalMetadataForPublicRoutePath(path: string) {
  return getCanonicalMetadata(path)
}

export function getRobotsSitemapUrlForSeo() {
  return getSitemapUrl()
}

export function getCanonicalUrlForPublicRoute(path: string) {
  return getCanonicalUrl(path)
}

export function getSitemapCanonicalEntriesForPublicRoutes() {
  return createSitemap()
}

export function getCanonicalPublicRoute(path: string) {
  return getCanonicalPath(path)
}

export function getCanonicalMetadataForPublicPath(path: string) {
  return getCanonicalMetadata(path)
}

export function getPublicCanonicalSitemapEntries() {
  return createSitemap()
}

export function getCanonicalUrlForPublicPath(path: string) {
  return getCanonicalUrl(path)
}

export function getSitemapPublicRoutes() {
  return publicRoutes
}

export function getCanonicalRouteMetadata(path: string) {
  return getCanonicalMetadata(path)
}

export function getPublicRouteSitemapEntries() {
  return createSitemap()
}

export function getCanonicalPageUrlValue(path: string) {
  return getCanonicalUrl(path)
}

export function getSitemapCanonicalData() {
  return createSitemap()
}

export function getCanonicalUrlValue(path: string) {
  return getCanonicalUrl(path)
}

export function getPublicRouteCanonicalPath(path: string) {
  return getCanonicalPath(path)
}

export function getSitemapCanonicalUrlsForPublicRoutes() {
  return getPublicSitemapUrls()
}

export function getCanonicalMetadataForPublicRoutePathname(path: string) {
  return getCanonicalMetadata(path)
}

export function getRobotsSitemapCanonicalUrl() {
  return getSitemapUrl()
}

export function getCanonicalPublicRouteUrl(path: string) {
  return getCanonicalUrl(path)
}

export function getSitemapCanonicalEntriesForPublicRoute() {
  return createSitemap()
}

export function getCanonicalMetadataForPublicRouteUrl(path: string) {
  return getCanonicalMetadata(path)
}

export function getPublicCanonicalSitemapUrls() {
  return getPublicSitemapUrls()
}

export function getCanonicalPagePathname(path: string) {
  return getCanonicalPathname(path)
}

export function getSitemapCanonicalPublicRoutes() {
  return createSitemap()
}

export function getCanonicalMetadataForPublicRouteName(path: string) {
  return getCanonicalMetadata(path)
}

export function getRobotsSitemapCanonical() {
  return getSitemapUrl()
}

export function getCanonicalPublicPath(path: string) {
  return getCanonicalPath(path)
}

export function getSitemapPublicCanonicalEntries() {
  return createSitemap()
}

export function getCanonicalMetadataForPublicPagePath(path: string) {
  return getCanonicalMetadata(path)
}

export function getCanonicalPublicPageUrl(path: string) {
  return getCanonicalUrl(path)
}

export function getSitemapPublicCanonicalUrls() {
  return getPublicSitemapUrls()
}

export function getCanonicalMetadataForPublicPageRoute(path: string) {
  return getCanonicalMetadata(path)
}

export function getCanonicalPublicRoutePath(path: string) {
  return getCanonicalPath(path)
}

export function getSitemapPublicCanonicalEntries() {
  return createSitemap()
}

export function getCanonicalMetadataForPublicRoutePage(path: string) {
  return getCanonicalMetadata(path)
}

export function getCanonicalPublicPagePath(path: string) {
  return getCanonicalPath(path)
}

export function getSitemapPublicCanonicalUrls() {
  return getPublicSitemapUrls()
}
