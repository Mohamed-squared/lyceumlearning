import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MainNav } from "@/components/layout/main-nav"
import { ClubsList } from "@/components/clubs/clubs-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function ClubsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Clubs</h1>
              <p className="text-muted-foreground">Join communities of learners with shared interests</p>
            </div>
            <Button asChild>
              <Link href="/clubs/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Club
              </Link>
            </Button>
          </div>

          <Suspense fallback={<div>Loading clubs...</div>}>
            <ClubsList />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
