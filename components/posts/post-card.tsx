"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PostCardProps {
  post: {
    id: string
    content: string
    image_url: string | null
    created_at: string
    user_id: string
    profiles: {
      username: string
      full_name: string | null
      avatar_url: string | null
    }
    post_upvotes: { user_id: string }[]
    comments: { count: number }[]
  }
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [isLiked, setIsLiked] = useState(post.post_upvotes.some((upvote) => upvote.user_id === user?.id))
  const [likeCount, setLikeCount] = useState(post.post_upvotes.length)

  const handleLike = async () => {
    if (!user) return

    try {
      if (isLiked) {
        // Unlike
        await supabase.from("post_upvotes").delete().eq("post_id", post.id).eq("user_id", user.id)

        setIsLiked(false)
        setLikeCount((prev) => prev - 1)
      } else {
        // Like
        await supabase.from("post_upvotes").insert({ post_id: post.id, user_id: user.id })

        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  const handleReport = async () => {
    if (!user) return

    try {
      await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_content_type: "post",
        reported_content_id: post.id,
        reason: "Inappropriate content",
      })
    } catch (error) {
      console.error("Error reporting post:", error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.profiles.avatar_url || ""} />
              <AvatarFallback>{post.profiles.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Link href={`/profile/${post.profiles.username}`} className="font-medium hover:underline">
                {post.profiles.full_name || post.profiles.username}
              </Link>
              <p className="text-sm text-muted-foreground">
                @{post.profiles.username} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleReport}>Report post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap">{post.content}</p>

        {post.image_url && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg">
            <Image src={post.image_url || "/placeholder.svg"} alt="Post image" fill className="object-cover" />
          </div>
        )}

        <div className="flex items-center space-x-4 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`space-x-2 ${isLiked ? "text-red-500" : ""}`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            <span>{likeCount}</span>
          </Button>

          <Button variant="ghost" size="sm" className="space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>{post.comments?.[0]?.count || 0}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
