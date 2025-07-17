"use client"

import type React from "react"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Coins, TrendingUp, Crown, Medal, Award } from "lucide-react"
import Link from "next/link"

export function LeaderboardContent() {
  const { user } = useAuth()
  const supabase = createClient()

  const { data: creditLeaders, isLoading: creditsLoading } = useQuery({
    queryKey: ["credit-leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, credits, role")
        .order("credits", { ascending: false })
        .limit(50)

      return data || []
    },
  })

  const { data: postLeaders, isLoading: postsLoading } = useQuery({
    queryKey: ["post-leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select(`
          id, username, full_name, avatar_url, role,
          posts(count)
        `)
        .order("posts(count)", { ascending: false })
        .limit(50)

      return data || []
    },
  })

  const { data: courseLeaders, isLoading: coursesLoading } = useQuery({
    queryKey: ["course-leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select(`
          id, username, full_name, avatar_url, role,
          courses(count)
        `)
        .order("courses(count)", { ascending: false })
        .limit(50)

      return data || []
    },
  })

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">1st</Badge>
      case 2:
        return <Badge className="bg-gray-400 hover:bg-gray-500">2nd</Badge>
      case 3:
        return <Badge className="bg-amber-600 hover:bg-amber-700">3rd</Badge>
      default:
        return <Badge variant="outline">#{rank}</Badge>
    }
  }

  const LeaderboardList = ({
    leaders,
    isLoading,
    valueKey,
    valueLabel,
    icon,
  }: {
    leaders: any[]
    isLoading: boolean
    valueKey: string
    valueLabel: string
    icon: React.ReactNode
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {icon}
          <span>{valueLabel} Leaders</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="h-6 bg-muted rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((leader, index) => {
              const rank = index + 1
              const isCurrentUser = leader.id === user?.id
              const value = valueKey.includes(".") ? leader[valueKey.split(".")[0]]?.[0]?.count || 0 : leader[valueKey]

              return (
                <Link key={leader.id} href={`/profile/${leader.username}`}>
                  <div
                    className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                      isCurrentUser ? "bg-primary/10 border border-primary/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-center w-8">{getRankIcon(rank)}</div>

                    <Avatar className="h-10 w-10">
                      <AvatarImage src={leader.avatar_url || ""} />
                      <AvatarFallback>{leader.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium truncate">{leader.full_name || leader.username}</p>
                        {leader.role === "admin" && <Badge variant="default">Admin</Badge>}
                        {isCurrentUser && <Badge variant="secondary">You</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">@{leader.username}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{value}</span>
                      {getRankBadge(rank)}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <Tabs defaultValue="credits" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="credits">Credits</TabsTrigger>
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="courses">Courses</TabsTrigger>
      </TabsList>

      <TabsContent value="credits">
        <LeaderboardList
          leaders={creditLeaders || []}
          isLoading={creditsLoading}
          valueKey="credits"
          valueLabel="Credit"
          icon={<Coins className="h-5 w-5 text-yellow-500" />}
        />
      </TabsContent>

      <TabsContent value="posts">
        <LeaderboardList
          leaders={postLeaders || []}
          isLoading={postsLoading}
          valueKey="posts.count"
          valueLabel="Post"
          icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
        />
      </TabsContent>

      <TabsContent value="courses">
        <LeaderboardList
          leaders={courseLeaders || []}
          isLoading={coursesLoading}
          valueKey="courses.count"
          valueLabel="Course"
          icon={<Trophy className="h-5 w-5 text-purple-500" />}
        />
      </TabsContent>
    </Tabs>
  )
}
