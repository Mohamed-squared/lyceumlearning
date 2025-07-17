import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MainNav } from "@/components/layout/main-nav"
import { HomeFeed } from "@/components/home/home-feed"
import { CreatePostCard } from "@/components/posts/create-post-card"
import { FeedSkeleton } from "@/components/home/feed-skeleton"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container max-w-2xl py-6">
        <div className="space-y-6">
          <CreatePostCard />
          <Suspense fallback={<FeedSkeleton />}>
            <HomeFeed />
          </Suspense>
        </div>
      </main>
    </div>
  )
}
