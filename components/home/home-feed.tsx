"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { PostCard } from "@/components/posts/post-card"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function HomeFeed() {
  const { user } = useAuth()
  const supabase = createClient()

  const { data: posts, isLoading } = useQuery({
    queryKey: ["home-feed", user?.id],
    queryFn: async () => {
      // Get posts from followed users and popular posts
      const { data } = await supabase
        .from("posts")
        .select(`
          *,
          profiles!posts_user_id_fkey(username, full_name, avatar_url),
          post_upvotes(user_id),
          comments(count)
        `)
        .order("created_at", { ascending: false })
        .limit(20)

      return data || []
    },
    enabled: !!user,
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
          <p className="text-muted-foreground">No posts yet. Start following users to see their content!</p>
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
