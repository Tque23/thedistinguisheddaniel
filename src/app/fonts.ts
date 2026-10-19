import localFont from "next/font/local"

export const trajan = localFont({
  src: [
    { path: "./fonts/TrajanPro3-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/TrajanPro3-Semibold.otf", weight: "600", style: "normal" },
  ],
  variable: "--font-trajan",
  display: "swap",
  preload: true,
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
})
