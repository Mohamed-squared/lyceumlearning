import { Suspense } from "react"
import { HomeFeed } from "@/components/home/home-feed"
import { CreatePostCard } from "@/components/posts/create-post-card"
import { FeedSkeleton } from "@/components/home/feed-skeleton"

export default async function HomePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6">
        <CreatePostCard />
        <Suspense fallback={<FeedSkeleton />}>
          <HomeFeed />
        </Suspense>
      </div>
    </div>
  )
}
