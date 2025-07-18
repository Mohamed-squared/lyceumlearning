import { Suspense } from "react"
import { CourseList } from "@/components/courses/course-list"
import { CourseFilters } from "@/components/courses/course-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function CoursesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">Discover and enroll in courses to enhance your learning</p>
        </div>
        <Button asChild>
          <Link href="/courses/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Link>
        </Button>
      </div>

      <CourseFilters />

      <Suspense fallback={<div>Loading courses...</div>}>
        <CourseList />
      </Suspense>
    </div>
  )
}
