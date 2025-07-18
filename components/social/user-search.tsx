"use client"

import { useState, useEffect } from "react"
import { Search, UserPlus, MessageCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"

interface User {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  credits: number
  is_friend: boolean
  has_pending_request: boolean
}

export function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const searchUsers = async (query: string) => {
    if (!query.trim() || !user) return

    setLoading(true)
    try {
      // Search for users by username or full name
      const { data: searchResults, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, credits")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq("id", user.id)
        .limit(20)

      if (error) throw error

      // Check friendship status for each user
      const usersWithStatus = await Promise.all(
        searchResults.map(async (profile) => {
          // Check if already friends
          const { data: friendship } = await supabase
            .from("friendships")
            .select("id")
            .or(
              `and(user1_id.eq.${user.id},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${user.id})`,
            )
            .single()

          // Check if there's a pending friend request
          const { data: pendingRequest } = await supabase
            .from("friend_requests")
            .select("id")
            .eq("sender_id", user.id)
            .eq("receiver_id", profile.id)
            .eq("status", "pending")
            .single()

          return {
            ...profile,
            is_friend: !!friendship,
            has_pending_request: !!pendingRequest,
          }
        }),
      )

      setUsers(usersWithStatus)
    } catch (error) {
      console.error("Error searching users:", error)
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (receiverId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("friend_requests").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: "pending",
      })

      if (error) throw error

      // Update local state
      setUsers(users.map((u) => (u.id === receiverId ? { ...u, has_pending_request: true } : u)))

      toast({
        title: "Success",
        description: "Friend request sent!",
      })
    } catch (error) {
      console.error("Error sending friend request:", error)
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      })
    }
  }

  const startChat = async (userId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc("get_or_create_direct_chat", {
        user1_id: user.id,
        user2_id: userId,
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
    const delayedSearch = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      } else {
        setUsers([])
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchQuery])

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search users by username or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      )}

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{user.username}</h3>
                    {user.full_name && <p className="text-sm text-muted-foreground">{user.full_name}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{user.credits} credits</Badge>
                  {user.is_friend ? (
                    <Badge variant="default">Friend</Badge>
                  ) : user.has_pending_request ? (
                    <Badge variant="outline">Request Sent</Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {user.bio && <p className="text-sm text-muted-foreground mb-4">{user.bio}</p>}
              <div className="flex space-x-2">
                {user.is_friend ? (
                  <Button size="sm" onClick={() => startChat(user.id)} className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Message</span>
                  </Button>
                ) : !user.has_pending_request ? (
                  <Button size="sm" onClick={() => sendFriendRequest(user.id)} className="flex items-center space-x-2">
                    <UserPlus className="h-4 w-4" />
                    <span>Add Friend</span>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {searchQuery && !loading && users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users found matching your search.</p>
        </div>
      )}
    </div>
  )
}
