"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Send, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export default function ChatPage() {
  const { chatId } = useParams()
  const { user } = useAuth()
  const router = useRouter()
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: chat, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chats")
        .select(
          `
          id,
          name,
          type,
          chat_participants (
            user_id,
            profiles (
              username,
              full_name,
              avatar_url
            )
          )
        `,
        )
        .eq("id", chatId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!chatId,
  })

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["chat-messages", chatId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          content,
          created_at,
          sender_id,
          profiles!messages_sender_id_fkey (
            username,
            full_name,
            avatar_url
          )
        `,
        )
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true })

      if (error) throw error
      return data
    },
    enabled: !!chatId,
  })

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!chatId) return

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", chatId] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, queryClient, supabase])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !user) return

    setSending(true)
    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          content: newMessage.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setSending(false)
    }
  }

  if (isLoading || messagesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chat not found or you do not have access.</p>
        <Button asChild>
          <Link href="/inbox">Back to Inbox</Link>
        </Button>
      </div>
    )
  }

  const otherParticipant = chat.chat_participants?.find((p) => p.user_id !== user?.id)
  const displayName =
    chat.type === "group"
      ? chat.name || "Group Chat"
      : otherParticipant?.profiles?.full_name || otherParticipant?.profiles?.username || "Unknown User"

  return (
    <div className="container mx-auto px-0 sm:px-4 py-6 max-w-4xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center space-x-4 pb-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => router.push("/inbox")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar>
            <AvatarImage src={otherParticipant?.profiles?.avatar_url || ""} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold">{displayName}</h1>
            {chat.type === "direct" && otherParticipant?.profiles?.username && (
              <p className="text-sm text-muted-foreground">@{otherParticipant.profiles.username}</p>
            )}
          </div>
        </div>

        {/* Messages */}
        <Card className="h-[calc(100vh-250px)] flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages?.map((message) => {
              const isCurrentUser = message.sender_id === user?.id
              return (
                <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`flex space-x-2 max-w-xs lg:max-w-md ${
                      isCurrentUser ? "flex-row-reverse space-x-reverse" : ""
                    }`}
                  >
                    {!isCurrentUser && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={message.profiles?.avatar_url || ""} />
                        <AvatarFallback>{message.profiles?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p
                        className={`text-xs mt-1 text-right ${
                          isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Message Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                disabled={sending}
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
