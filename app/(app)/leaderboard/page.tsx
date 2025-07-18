import { LeaderboardContent } from "@/components/leaderboard/leaderboard-content"

export default async function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">See who's leading in credits and achievements</p>
      </div>

      <LeaderboardContent />
    </div>
  )
}
