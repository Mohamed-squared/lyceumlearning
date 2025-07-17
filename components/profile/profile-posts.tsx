"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { PostCard } from "@/components/posts/post-card"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { Profile } from "@/lib/supabase/types"

interface ProfilePostsProps {
  profile: Profile
}

export function ProfilePosts({ profile }: ProfilePostsProps) {
  const supabase = createClient()

  const { data: posts, isLoading } = useQuery({
    queryKey: ["profile-posts", profile.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey(username, full_name, avatar_url),
          post_upvotes(user_id),
          comments(count)
        `)
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })

      return data || []
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No posts yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
