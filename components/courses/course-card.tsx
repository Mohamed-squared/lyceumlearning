import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, User, Users, Star } from "lucide-react"
import Link from "next/link"

interface CourseCardProps {
  course: {
    id: string
    title: string
    description: string | null
    course_type: string
    major: string | null
    subject: string | null
    is_starred_by_admin: boolean
    profiles: {
      username: string
      full_name: string | null
    } | null
    course_enrollments: { count: number }[]
  }
}

export function CourseCard({ course }: CourseCardProps) {
  const enrollmentCount = course.course_enrollments?.[0]?.count || 0

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <CardTitle className="line-clamp-2">{course.title}</CardTitle>
              {course.is_starred_by_admin && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
            </div>
            <CardDescription className="line-clamp-2">
              {course.description || "No description provided"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{course.course_type}</Badge>
          {course.major && <Badge variant="outline">{course.major}</Badge>}
          {course.subject && <Badge variant="outline">{course.subject}</Badge>}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          {course.profiles && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>by {course.profiles.full_name || course.profiles.username}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{enrollmentCount} enrolled</span>
          </div>
        </div>

        <Button asChild className="w-full">
          <Link href={`/courses/${course.id}`}>
            <BookOpen className="mr-2 h-4 w-4" />
            View Course
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
