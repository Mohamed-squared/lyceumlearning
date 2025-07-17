"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProfilePosts } from "./profile-posts"
import { ProfileCourses } from "./profile-courses"
import { ProfileActivity } from "./profile-activity"
import type { Profile } from "@/lib/supabase/types"

interface ProfileTabsProps {
  profile: Profile
}

export function ProfileTabs({ profile }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="posts" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="posts">Posts</TabsTrigger>
        <TabsTrigger value="courses">Courses</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        <ProfilePosts profile={profile} />
      </TabsContent>

      <TabsContent value="courses">
        <ProfileCourses profile={profile} />
      </TabsContent>

      <TabsContent value="activity">
        <ProfileActivity profile={profile} />
      </TabsContent>
    </Tabs>
  )
}
