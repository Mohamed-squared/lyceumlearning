import type React from "react"
import { MainNav } from "@/components/layout/main-nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <MainNav />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">{children}</main>
    </div>
  )
}
