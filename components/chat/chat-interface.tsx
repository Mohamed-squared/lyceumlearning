"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/providers/auth-provider"
import { Send, ArrowLeft } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import type { Profile } from "@/lib/supabase/types"

interface ChatInterfaceProps {
  otherUser: Profile
}

export function ChatInterface({ otherUser }: ChatInterfaceProps) {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "Hey! How's the calculus course going?",
      sender_id: otherUser.id,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "2",
      content: "It's going well! The testbank you shared really helped.",
      sender_id: "current-user",
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: "3",
      content: "Glad to hear that! Let me know if you need help with any specific topics.",
      sender_id: otherUser.id,
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
  ])
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user) return

    const newMessage = {
      id: Date.now().toString(),
      content: message.trim(),
      sender_id: user.id,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage("")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inbox">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Avatar>
          <AvatarImage src={otherUser.avatar_url || ""} />
          <AvatarFallback>{otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold">{otherUser.full_name || otherUser.username}</h1>
          <p className="text-sm text-muted-foreground">@{otherUser.username}</p>
        </div>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isCurrentUser = msg.sender_id === user?.id
            return (
              <div key={msg.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                  >
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
