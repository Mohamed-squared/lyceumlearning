"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Coins, Trophy } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Profile } from "@/lib/supabase/types"

interface ProfileActivityProps {
  profile: Profile
}

export function ProfileActivity({ profile }: ProfileActivityProps) {
  const supabase = createClient()

  const { data: activity, isLoading } = useQuery({
    queryKey: ["profile-activity", profile.id],
    queryFn: async () => {
      const { data: creditHistory } = await supabase
        .from("credits_ledger")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10)

      return {
        creditHistory: creditHistory || [],
      }
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span>Recent Credit Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activity?.creditHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No credit activity yet</p>
          ) : (
            <div className="space-y-3">
              {activity?.creditHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{entry.reason.replace(/_/g, " ")}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={entry.amount > 0 ? "default" : "destructive"}>
                    {entry.amount > 0 ? "+" : ""}
                    {entry.amount}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-purple-500" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Achievement system coming soon!</p>
        </CardContent>
      </Card>
    </div>
  )
}
