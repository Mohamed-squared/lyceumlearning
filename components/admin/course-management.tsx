"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Search, Star, Trash2, Archive } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"

export function CourseManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: courses, isLoading } = useQuery({
    queryKey: ["admin-courses", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("courses")
        .select(`
          *,
          profiles!courses_owner_id_fkey(username, full_name),
          course_enrollments(count)
        `)
        .order("created_at", { ascending: false })

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`)
      }

      const { data } = await query
      return data || []
    },
  })

  const handleToggleStar = async (courseId: string, isStarred: boolean) => {
    try {
      const { error } = await supabase.from("courses").update({ is_starred_by_admin: !isStarred }).eq("id", courseId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["admin-courses"] })

      toast({
        title: "Success",
        description: isStarred ? "Course unstarred" : "Course starred",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      })
    }
  }

  const handleArchiveCourse = async (courseId: string, isArchived: boolean) => {
    try {
      const { error } = await supabase.from("courses").update({ is_archived: !isArchived }).eq("id", courseId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["admin-courses"] })

      toast({
        title: "Success",
        description: isArchived ? "Course restored" : "Course archived",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive course",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase.from("courses").delete().eq("id", courseId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["admin-courses"] })

      toast({
        title: "Success",
        description: "Course deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Management</CardTitle>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses?.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {course.is_starred_by_admin && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    <div>
                      <div className="font-medium">{course.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{course.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{course.course_type}</Badge>
                </TableCell>
                <TableCell>
                  {course.profiles ? (
                    <div>
                      <div className="font-medium">{course.profiles.full_name || course.profiles.username}</div>
                      <div className="text-sm text-muted-foreground">@{course.profiles.username}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No owner</span>
                  )}
                </TableCell>
                <TableCell>{course.course_enrollments?.[0]?.count || 0}</TableCell>
                <TableCell>
                  <Badge variant={course.is_archived ? "destructive" : "default"}>
                    {course.is_archived ? "Archived" : "Active"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(course.created_at), { addSuffix: true })}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggleStar(course.id, course.is_starred_by_admin)}>
                        <Star className="mr-2 h-4 w-4" />
                        {course.is_starred_by_admin ? "Unstar" : "Star"} Course
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchiveCourse(course.id, course.is_archived)}>
                        <Archive className="mr-2 h-4 w-4" />
                        {course.is_archived ? "Restore" : "Archive"} Course
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteCourse(course.id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Course
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
