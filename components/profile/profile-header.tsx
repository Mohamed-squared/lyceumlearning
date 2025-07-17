"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { UserPlus, UserMinus, MessageCircle, Coins } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Profile } from "@/lib/supabase/types"

interface ProfileHeaderProps {
  profile: Profile
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [isFollowing, setIsFollowing] = useState(false)

  const { data: followData } = useQuery({
    queryKey: ["follow-status", user?.id, profile.id],
    queryFn: async () => {
      if (!user) return null

      const { data } = await supabase
        .from("follows")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", profile.id)
        .single()

      setIsFollowing(!!data)
      return data
    },
    enabled: !!user && user.id !== profile.id,
  })

  const { data: stats } = useQuery({
    queryKey: ["profile-stats", profile.id],
    queryFn: async () => {
      const [{ count: followersCount }, { count: followingCount }, { count: postsCount }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
      ])

      return {
        followers: followersCount || 0,
        following: followingCount || 0,
        posts: postsCount || 0,
      }
    },
  })

  const handleFollow = async () => {
    if (!user) return

    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id)

        setIsFollowing(false)
      } else {
        await supabase.from("follows").insert({
          follower_id: user.id,
          following_id: profile.id,
        })

        setIsFollowing(true)
      }

      queryClient.invalidateQueries({ queryKey: ["profile-stats"] })
      queryClient.invalidateQueries({ queryKey: ["follow-status"] })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      })
    }
  }

  const isOwnProfile = user?.id === profile.id

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Avatar className="h-24 w-24 mx-auto md:mx-0">
            <AvatarImage src={profile.avatar_url || ""} />
            <AvatarFallback className="text-2xl">{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
              <p className="text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
            </div>

            <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
              <div className="text-center">
                <div className="font-semibold">{stats?.posts || 0}</div>
                <div className="text-muted-foreground">Posts</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{stats?.followers || 0}</div>
                <div className="text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="font-semibold">{stats?.following || 0}</div>
                <div className="text-muted-foreground">Following</div>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4">
              <div className="flex items-center space-x-1">
                <Coins className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{profile.credits} credits</span>
              </div>
              {profile.role === "admin" && <Badge variant="default">Admin</Badge>}
            </div>

            {!isOwnProfile && user && (
              <div className="flex gap-2 justify-center md:justify-start">
                <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                  {isFollowing ? (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
                <Button variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
