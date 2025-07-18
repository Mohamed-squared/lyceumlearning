import { ClubCreator } from "@/components/clubs/club-creator"

export default async function CreateClubPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Club</h1>
          <p className="text-muted-foreground">Start a community for learners with shared interests</p>
        </div>

        <ClubCreator />
      </div>
    </div>
  )
}
