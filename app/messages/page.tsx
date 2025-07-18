"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageCircle, Search, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface Chat {
  id: string
  name: string | null
  type: "direct" | "group"
  last_message_at: string | null
  participants: {
    user_id: string
    profiles: {
      username: string
      full_name: string | null
      avatar_url: string | null
    }
  }[]
  messages: {
    content: string
    created_at: string
    sender_id: string
  }[]
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: chats, isLoading } = useQuery({
    queryKey: ["user-chats", user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from("chats")
        .select(`
          id,
          name,
          type,
          last_message_at,
          chat_participants!inner (
            user_id,
            profiles (
              username,
              full_name,
              avatar_url
            )
          ),
          messages (
            content,
            created_at,
            sender_id
          )
        `)
        .eq("chat_participants.user_id", user.id)
        .order("last_message_at", { ascending: false, nullsFirst: false })

      if (error) throw error

      // Filter out current user from participants and get latest message
      return (
        data?.map((chat) => ({
          ...chat,
          participants: chat.chat_participants?.filter((p) => p.user_id !== user.id) || [],
          latestMessage: chat.messages?.[0] || null,
        })) || []
      )
    },
    enabled: !!user,
  })

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=in.(${chats?.map((c) => c.id).join(",") || ""})`,
        },
        () => {
          // Refetch chats when new message arrives
          queryClient.invalidateQueries({ queryKey: ["user-chats", user.id] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, chats])

  const filteredChats = chats?.filter((chat) => {
    if (!searchQuery) return true

    const otherParticipant = chat.participants[0]
    const searchTerm = searchQuery.toLowerCase()

    return (
      chat.name?.toLowerCase().includes(searchTerm) ||
      otherParticipant?.profiles?.username?.toLowerCase().includes(searchTerm) ||
      otherParticipant?.profiles?.full_name?.toLowerCase().includes(searchTerm)
    )
  })

  const handleStartNewChat = async () => {
    // This would open a modal to select users to chat with
    // For now, we'll just show a placeholder
    alert("Feature coming soon: Start new chat")
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Messages</h1>
          <Button onClick={handleStartNewChat}>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Conversations</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
                    <div className="w-10 h-10 bg-muted rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/4" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredChats?.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No conversations</h3>
                <p className="mt-1 text-sm text-muted-foreground">Start a conversation with other learners!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredChats?.map((chat) => {
                  const otherParticipant = chat.participants[0]
                  const displayName =
                    chat.type === "group"
                      ? chat.name || "Group Chat"
                      : otherParticipant?.profiles?.full_name || otherParticipant?.profiles?.username || "Unknown User"

                  return (
                    <Link key={chat.id} href={`/messages/${chat.id}`}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <Avatar>
                          <AvatarImage src={otherParticipant?.profiles?.avatar_url || ""} />
                          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{displayName}</p>
                            <div className="flex items-center space-x-2">
                              {chat.last_message_at && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(chat.last_message_at), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {chat.latestMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
