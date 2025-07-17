"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { CourseCard } from "@/components/courses/course-card"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { Profile } from "@/lib/supabase/types"

interface ProfileCoursesProps {
  profile: Profile
}

export function ProfileCourses({ profile }: ProfileCoursesProps) {
  const supabase = createClient()

  const { data: courses, isLoading } = useQuery({
    queryKey: ["profile-courses", profile.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("course_enrollments")
        .select(`
          *,
          courses(
            *,
            profiles!courses_owner_id_fkey(username, full_name),
            course_enrollments(count)
          )
        `)
        .eq("user_id", profile.id)
        .eq("is_visible_on_profile", true)

      return data?.map((enrollment) => enrollment.courses).filter(Boolean) || []
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

  if (!courses || courses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No courses enrolled</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
