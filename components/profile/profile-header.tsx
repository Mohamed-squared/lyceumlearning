"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { UserPlus, UserMinus, UserCheck, MessageCircle, Coins, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Profile } from "@/lib/supabase/types"
import { useRouter } from "next/navigation"

interface ProfileHeaderProps {
  profile: Profile
}

type FriendshipStatus = "not_friends" | "pending_sent" | "pending_received" | "friends"

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [loadingAction, setLoadingAction] = useState(false)

  const { data: friendshipStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["friendship-status", user?.id, profile.id],
    queryFn: async (): Promise<FriendshipStatus> => {
      if (!user || user.id === profile.id) return "not_friends"

      // Check if they are already friends
      const { data: friendship } = await supabase
        .from("friendships")
        .select("id")
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${user.id})`)
        .single()
      if (friendship) return "friends"

      // Check for a pending request
      const { data: request } = await supabase
        .from("friend_requests")
        .select("sender_id")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
        .eq("status", "pending")
        .single()

      if (request) {
        return request.sender_id === user.id ? "pending_sent" : "pending_received"
      }

      return "not_friends"
    },
    enabled: !!user && user.id !== profile.id,
  })

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", profile.id],
    queryFn: async () => {
      const [{ count: postsCount }, { count: friendsCount }] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase
          .from("friendships")
          .select("*", { count: "exact", head: true })
          .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`),
      ])
      return {
        posts: postsCount || 0,
        friends: friendsCount || 0,
      }
    },
  })

  const handleFriendAction = async () => {
    if (!user) return
    setLoadingAction(true)

    try {
      if (friendshipStatus === "not_friends") {
        // Send friend request
        const { error } = await supabase.from("friend_requests").insert({ sender_id: user.id, receiver_id: profile.id })
        if (error) throw error
        toast({ title: "Success", description: "Friend request sent!" })
      } else if (friendshipStatus === "pending_sent") {
        // Cancel friend request
        const { error } = await supabase
          .from("friend_requests")
          .delete()
          .eq("sender_id", user.id)
          .eq("receiver_id", profile.id)
        if (error) throw error
        toast({ title: "Success", description: "Friend request cancelled." })
      }
      // In a real app, you'd handle accepting/declining 'pending_received' here too
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      queryClient.invalidateQueries({ queryKey: ["friendship-status", user.id, profile.id] })
      setLoadingAction(false)
    }
  }

  const startChat = async () => {
    if (!user) return;
    setLoadingAction(true);
    try {
      const { data: chatId, error } = await supabase.rpc("get_or_create_direct_chat", {
        user1_id: user.id,
        user2_id: profile.id,
      })
      if (error) throw error
      router.push(`/messages/${chatId}`)
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to start chat.",
        variant: "destructive",
      })
    } finally {
        setLoadingAction(false)
    }
  }


  const isOwnProfile = user?.id === profile.id

  const renderFriendButton = () => {
    if (isLoadingStatus) return <Button disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading</Button>

    switch (friendshipStatus) {
      case "friends":
        return <Button variant="secondary"><UserCheck className="mr-2 h-4 w-4" />Friends</Button>
      case "pending_sent":
        return <Button variant="outline" onClick={handleFriendAction} disabled={loadingAction}><UserMinus className="mr-2 h-4 w-4" />Cancel Request</Button>
      case "pending_received":
         return <Button variant="default">Respond to Request</Button> // Or link to requests page
      case "not_friends":
      default:
        return <Button onClick={handleFriendAction} disabled={loadingAction}><UserPlus className="mr-2 h-4 w-4" />Add Friend</Button>
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Avatar className="h-24 w-24 mx-auto md:mx-0">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="text-2xl">{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
              <div className="text-center">
                <div className="font-semibold">{stats?.posts || 0}</div>
                <div className="text-muted-foreground">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{stats?.friends || 0}</div>
                <div className="text-muted-foreground">Friends</div>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="flex items-center space-x-1">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{profile.credits} credits</span>
              </div>
              {profile.role === "admin" && <Badge>Admin</Badge>}
            </div>

            {!isOwnProfile && user && (
              <div className="flex gap-2 justify-center md:justify-start">
                {renderFriendButton()}
                <Button variant="outline" onClick={startChat} disabled={loadingAction}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
