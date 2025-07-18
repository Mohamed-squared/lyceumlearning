"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"

interface Friend {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  credits: number
}

export function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const fetchFriends = async () => {
    if (!user) return

    try {
      const { data: friendships, error } = await supabase
        .from("friendships")
        .select(`
          user1_id,
          user2_id,
          user1:profiles!friendships_user1_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            bio,
            credits
          ),
          user2:profiles!friendships_user2_id_fkey(
            id,
            username,
            full_name,
            avatar_url,
            bio,
            credits
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

      if (error) throw error

      // Extract friends (the other user in each friendship)
      const friendsList =
        friendships
          ?.map((friendship) => {
            if (friendship.user1_id === user.id) {
              return friendship.user2
            } else {
              return friendship.user1
            }
          })
          .filter(Boolean) || []

      setFriends(friendsList)
    } catch (error) {
      console.error("Error fetching friends:", error)
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const startChat = async (friendId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc("get_or_create_direct_chat", {
        user1_id: user.id,
        user2_id: friendId,
      })

      if (error) throw error

      router.push(`/messages/${data}`)
    } catch (error) {
      console.error("Error creating chat:", error)
      toast({
        title: "Error",
        description: "Failed to start chat",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [user])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Friends ({friends.length})</h2>
      </div>

      {friends.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No friends yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Search for users and send friend requests to build your network!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {friends.map((friend) => (
            <Card key={friend.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={friend.avatar_url || ""} />
                      <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{friend.username}</h3>
                      {friend.full_name && <p className="text-sm text-muted-foreground">{friend.full_name}</p>}
                    </div>
                  </div>
                  <Badge variant="secondary">{friend.credits} credits</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {friend.bio && <p className="text-sm text-muted-foreground mb-4">{friend.bio}</p>}
                <Button size="sm" onClick={() => startChat(friend.id)} className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Message</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
