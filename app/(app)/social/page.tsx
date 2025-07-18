import { Suspense } from "react"
import { SocialContent } from "@/components/social/social-content"
import { SocialSkeleton } from "@/components/social/social-skeleton"

export default function SocialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Social</h1>
        <p className="text-muted-foreground">
          Connect with other learners, discover new friends, and build your network
        </p>
      </div>

      <Suspense fallback={<SocialSkeleton />}>
        <SocialContent />
      </Suspense>
    </div>
  )
}
