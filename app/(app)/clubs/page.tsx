import { Suspense } from "react"
import { ClubsList } from "@/components/clubs/clubs-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function ClubsPage() {
  return (
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
  )
}
