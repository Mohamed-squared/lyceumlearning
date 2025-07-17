"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { ClubCard } from "./club-card"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function ClubsList() {
  const supabase = createClient()

  const { data: clubs, isLoading } = useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clubs")
        .select(`
          *,
          profiles!clubs_owner_id_fkey(username, full_name),
          club_members(count)
        `)
        .order("created_at", { ascending: false })

      return data || []
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!clubs || clubs.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No clubs available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clubs.map((club) => (
        <ClubCard key={club.id} club={club} />
      ))}
    </div>
  )
}
