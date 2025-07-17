import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MainNav } from "@/components/layout/main-nav"
import { ClubCreator } from "@/components/clubs/club-creator"

export default async function CreateClubPage() {
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
      <main className="container max-w-2xl py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Club</h1>
            <p className="text-muted-foreground">Start a community for learners with shared interests</p>
          </div>

          <ClubCreator />
        </div>
      </main>
    </div>
  )
}
