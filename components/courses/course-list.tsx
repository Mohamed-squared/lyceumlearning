"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { CourseCard } from "./course-card"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function CourseList() {
  const supabase = createClient()

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select(`
          *,
          profiles!courses_owner_id_fkey(username, full_name),
          course_enrollments(count)
        `)
        .eq("is_archived", false)
        .order("is_starred_by_admin", { ascending: false })
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

  if (!courses || courses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No courses available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
