// lib/gallery.ts
import fs from "fs"
import path from "path"

export function getFolderImages(folderPath: string): string[] {
  const directory = path.join(process.cwd(), "public", folderPath)

  try {
    const filenames = fs.readdirSync(directory)
    return filenames
      .filter((file) => /\.(jpg|jpeg|png|webp|avif)$/i.test(file))
      .map((filename) => `/${folderPath}/${filename}`.replace(/\/+/g, "/"))
  } catch (error) {
    console.error(`Error reading directory public/${folderPath}:`, error)
    return []
  }
}