import localFont from "next/font/local"
import { Cormorant_Garamond, Playfair_Display } from "next/font/google"

export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-ddni-serif",
  display: "swap",
})

export const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
})

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
