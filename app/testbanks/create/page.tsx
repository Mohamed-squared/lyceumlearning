import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MainNav } from "@/components/layout/main-nav"
import { TestbankCreator } from "@/components/testbanks/testbank-creator"

export default async function CreateTestbankPage() {
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
      <main className="container max-w-4xl py-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Testbank</h1>
            <p className="text-muted-foreground">Generate questions using AI or create them manually</p>
          </div>

          <TestbankCreator />
        </div>
      </main>
    </div>
  )
}
