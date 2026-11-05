"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function CertificatePrintButton() {
  return (
    <Button className="btn-gold min-h-11 px-4" onClick={() => window.print()}>
      <Printer data-icon="inline-start" />
      Print certificate
    </Button>
  )
}
