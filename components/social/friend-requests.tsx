"use client"

import { useState, useEffect } from "react"
import { Check, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"

interface FriendRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: string
  created_at: string
  sender: {
    username: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
    credits: number
  }
}

export function FriendRequests() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createClient()

  const fetchFriendRequests = async () => {
    if (!user) return

    try {
      // Fetch incoming requests
      const { data: incoming, error: incomingError } = await supabase
        .from("friend_requests")
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          sender:profiles!friend_requests_sender_id_fkey(
            username,
            full_name,
            avatar_url,
            bio,
            credits
          )
        `)
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (incomingError) throw incomingError

      // Fetch outgoing requests
      const { data: outgoing, error: outgoingError } = await supabase
        .from("friend_requests")
        .select(`
          id,
          sender_id,
          receiver_id,
          status,
          created_at,
          receiver:profiles!friend_requests_receiver_id_fkey(
            username,
            full_name,
            avatar_url,
            bio,
            credits
          )
        `)
        .eq("sender_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (outgoingError) throw outgoingError

      setIncomingRequests(incoming || [])
      setOutgoingRequests(outgoing || [])
    } catch (error) {
      console.error("Error fetching friend requests:", error)
      toast({
        title: "Error",
        description: "Failed to load friend requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const respondToRequest = async (requestId: string, status: "accepted" | "declined") => {
    try {
      const { error } = await supabase
        .from("friend_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", requestId)

      if (error) throw error

      // Remove from incoming requests
      setIncomingRequests((prev) => prev.filter((req) => req.id !== requestId))

      toast({
        title: "Success",
        description: `Friend request ${status}!`,
      })
    } catch (error) {
      console.error("Error responding to friend request:", error)
      toast({
        title: "Error",
        description: "Failed to respond to friend request",
        variant: "destructive",
      })
    }
  }

  const cancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.from("friend_requests").delete().eq("id", requestId)

      if (error) throw error

      // Remove from outgoing requests
      setOutgoingRequests((prev) => prev.filter((req) => req.id !== requestId))

      toast({
        title: "Success",
        description: "Friend request cancelled!",
      })
    } catch (error) {
      console.error("Error cancelling friend request:", error)
      toast({
        title: "Error",
        description: "Failed to cancel friend request",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchFriendRequests()
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
      {/* Incoming Requests */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>
        {incomingRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No incoming friend requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {incomingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={request.sender.avatar_url || ""} />
                        <AvatarFallback>{request.sender.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{request.sender.username}</h3>
                        {request.sender.full_name && (
                          <p className="text-sm text-muted-foreground">{request.sender.full_name}</p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">{request.sender.credits} credits</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {request.sender.bio && <p className="text-sm text-muted-foreground mb-4">{request.sender.bio}</p>}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => respondToRequest(request.id, "accepted")}
                      className="flex items-center space-x-2"
                    >
                      <Check className="h-4 w-4" />
                      <span>Accept</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => respondToRequest(request.id, "declined")}
                      className="flex items-center space-x-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Decline</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing Requests */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Sent Requests</h2>
        {outgoingRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending sent requests</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {outgoingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={request.receiver?.avatar_url || ""} />
                        <AvatarFallback>{request.receiver?.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{request.receiver?.username}</h3>
                        {request.receiver?.full_name && (
                          <p className="text-sm text-muted-foreground">{request.receiver.full_name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{request.receiver?.credits} credits</Badge>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => cancelRequest(request.id)}
                    className="flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel Request</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
