"use client"

import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Trophy, TrendingUp, MessageSquare, Target, Coins } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

export function DashboardContent() {
  const { user, profile } = useAuth()
  const supabase = createClient()

  const { data: recentActivity } = useQuery({
    queryKey: ["dashboard-activity", user?.id],
    queryFn: async () => {
      const { data: posts } = await supabase
        .from("posts")
        .select("*, profiles(username, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(5)

      return { posts: posts || [] }
    },
    enabled: !!user,
  })

  const { data: courseProgress } = useQuery({
    queryKey: ["course-progress", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          courses(id, title, course_type)
        `)
        .eq("user_id", user!.id)
        .limit(3)

      return data || []
    },
    enabled: !!user,
  })

  const { data: creditHistory } = useQuery({
    queryKey: ["credit-history", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("credits_ledger")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10)

      return data || []
    },
    enabled: !!user,
  })

  if (!user || !profile) return null

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.credits}</div>
            <p className="text-xs text-muted-foreground">Available for challenges and AI features</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courseProgress?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active learning paths</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Testbanks Created</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Knowledge contributions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Ongoing competitions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest posts and updates from your network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity?.posts.map((post) => (
                <div key={post.id} className="flex space-x-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">@{post.profiles?.username}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                  </div>
                </div>
              ))}
              {(!recentActivity?.posts || recentActivity.posts.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity. Start following users to see their posts here.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>Your current learning progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courseProgress?.map((enrollment) => (
                <div key={enrollment.course_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{enrollment.courses?.title}</p>
                      <Badge variant="secondary" className="text-xs">
                        {enrollment.courses?.course_type}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              ))}
              {(!courseProgress || courseProgress.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No courses enrolled yet</p>
                  <Button size="sm" asChild>
                    <Link href="/courses">Browse Courses</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="inbox" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages & Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No messages</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your inbox is empty. Start conversations with other learners!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Challenges</CardTitle>
              <CardDescription>Compete with other learners and win credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">No active challenges</h3>
                <p className="mt-1 text-sm text-muted-foreground">Challenge other users to learning competitions</p>
                <Button className="mt-4" size="sm">
                  Create Challenge
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Credit History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {creditHistory?.slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{entry.reason}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <span className={`text-sm font-medium ${entry.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {entry.amount > 0 ? "+" : ""}
                        {entry.amount}
                      </span>
                    </div>
                  ))}
                  {(!creditHistory || creditHistory.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-4">No credit transactions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">0 days</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Start learning to build your streak!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
