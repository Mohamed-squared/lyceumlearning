"use client"

import { useState, useEffect } from "react"
import { Plus, MessageCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Chat {
  id: string
  type: string
  name: string | null
  last_message_at: string | null
  other_user?: {
    id: string
    username: string
    full_name: string | null
    avatar_url: string | null
  }
  last_message?: {
    content: string
    sender_id: string
  }
}

interface Friend {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
}

export function MessagesList() {
  const [chats, setChats] = useState<Chat[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const fetchChats = async () => {
    if (!user) return

    try {
      // Get user's chats
      const { data: userChats, error: chatsError } = await supabase
        .from("chat_participants")
        .select(`
          chat_id,
          chats!inner(
            id,
            type,
            name,
            last_message_at
          )
        `)
        .eq("user_id", user.id)

      if (chatsError) throw chatsError

      // For each chat, get the other participants and last message
      const chatsWithDetails = await Promise.all(
        userChats.map(async (userChat) => {
          const chat = userChat.chats

          // Get other participants (for direct chats)
          if (chat.type === "direct") {
            const { data: otherParticipant } = await supabase
              .from("chat_participants")
              .select(`
                user_id,
                profiles!inner(
                  id,
                  username,
                  full_name,
                  avatar_url
                )
              `)
              .eq("chat_id", chat.id)
              .neq("user_id", user.id)
              .single()

            if (otherParticipant) {
              chat.other_user = otherParticipant.profiles
            }
          }

          // Get last message
          const { data: lastMessage } = await supabase
            .from("messages")
            .select("content, sender_id")
            .eq("chat_id", chat.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          if (lastMessage) {
            chat.last_message = lastMessage
          }

          return chat
        }),
      )

      setChats(
        chatsWithDetails.sort(
          (a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime(),
        ),
      )
    } catch (error) {
      console.error("Error fetching chats:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

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
            avatar_url
          ),
          user2:profiles!friendships_user2_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

      if (error) throw error

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
    }
  }

  const startChatWithFriend = async (friendId: string) => {
    if (!user) return

    try {
      const response = await fetch("/api/chat/create-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otherUserId: friendId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create chat")
      }

      const { chatId } = await response.json()
      setShowNewMessageDialog(false)
      router.push(`/messages/${chatId}`)
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
    fetchChats()
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Messages</h2>
        <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>New Message</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start a New Conversation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No friends to message</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add friends from the Social tab to start conversations!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer"
                      onClick={() => startChatWithFriend(friend.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={friend.avatar_url || ""} />
                          <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{friend.username}</p>
                          {friend.full_name && <p className="text-sm text-muted-foreground">{friend.full_name}</p>}
                        </div>
                      </div>
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {chats.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-2">Start a conversation with your friends!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {chats.map((chat) => (
            <Link key={chat.id} href={`/messages/${chat.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={chat.other_user?.avatar_url || ""} />
                      <AvatarFallback>
                        {chat.type === "direct"
                          ? chat.other_user?.username.charAt(0).toUpperCase()
                          : chat.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">
                          {chat.type === "direct" ? chat.other_user?.username : chat.name}
                        </p>
                        {chat.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(chat.last_message_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {chat.last_message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.last_message.sender_id === user?.id ? "You: " : ""}
                          {chat.last_message.content}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
