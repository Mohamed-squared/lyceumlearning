"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Check, X, Coins } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"

export function ChallengesList() {
  const { user } = useAuth()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: challenges, isLoading } = useQuery({
    queryKey: ["challenges", user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data } = await supabase
        .from("challenges")
        .select(`
          *,
          challenger:profiles!challenges_challenger_id_fkey(username, full_name, avatar_url),
          opponent:profiles!challenges_opponent_id_fkey(username, full_name, avatar_url),
          courses(title)
        `)
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order("created_at", { ascending: false })

      return data || []
    },
    enabled: !!user,
  })

  const handleChallengeResponse = async (challengeId: string, status: "active" | "declined") => {
    try {
      const { error } = await supabase.from("challenges").update({ status }).eq("id", challengeId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["challenges"] })

      toast({
        title: "Success",
        description: status === "active" ? "Challenge accepted!" : "Challenge declined",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to respond to challenge",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "active":
        return "secondary"
      case "completed":
        return "outline"
      case "declined":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-5 w-5" />
          <span>Challenges</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!challenges || challenges.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No challenges</h3>
            <p className="mt-1 text-sm text-muted-foreground">Challenge other users to learning competitions!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => {
              const isChallenger = challenge.challenger_id === user?.id
              const otherUser = isChallenger ? challenge.opponent : challenge.challenger
              const isPending = challenge.status === "pending"
              const canRespond = !isChallenger && isPending

              return (
                <div key={challenge.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Avatar>
                    <AvatarImage src={otherUser?.avatar_url || ""} />
                    <AvatarFallback>{otherUser?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">
                        {isChallenger
                          ? `You challenged @${otherUser?.username}`
                          : `@${otherUser?.username} challenged you`}
                      </p>
                      <Badge variant={getStatusColor(challenge.status)}>{challenge.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Course: {challenge.courses?.title}</p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Coins className="h-3 w-3 text-yellow-500" />
                        <span>{challenge.credit_pot} credits</span>
                      </div>
                      <span>{formatDistanceToNow(new Date(challenge.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {canRespond && (
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleChallengeResponse(challenge.id, "active")}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleChallengeResponse(challenge.id, "declined")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
