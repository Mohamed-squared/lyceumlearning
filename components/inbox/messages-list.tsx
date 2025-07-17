"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { MessageCircle, Search, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export function MessagesList() {
  const [searchQuery, setSearchQuery] = useState("")
  const { user } = useAuth()
  const supabase = createClient()

  // For now, we'll show a placeholder since we haven't implemented the messages table yet
  const conversations = [
    {
      id: "1",
      participant: {
        username: "john_doe",
        full_name: "John Doe",
        avatar_url: null,
      },
      lastMessage: "Hey, how's the calculus course going?",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      unreadCount: 2,
    },
    {
      id: "2",
      participant: {
        username: "jane_smith",
        full_name: "Jane Smith",
        avatar_url: null,
      },
      lastMessage: "Thanks for sharing that testbank!",
      lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unreadCount: 0,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Messages</span>
          </CardTitle>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>
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
        {conversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No messages</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start a conversation with other learners!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Link key={conversation.id} href={`/inbox/chat/${conversation.participant.username}`} className="block">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Avatar>
                    <AvatarImage src={conversation.participant.avatar_url || ""} />
                    <AvatarFallback>{conversation.participant.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {conversation.participant.full_name || conversation.participant.username}
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(conversation.lastMessageTime, { addSuffix: true })}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="h-5 w-5 rounded-full p-0 text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
