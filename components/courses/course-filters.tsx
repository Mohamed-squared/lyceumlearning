"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter } from "lucide-react"

export function CourseFilters() {
  const [searchQuery, setSearchQuery] = useState("")
  const [courseType, setCourseType] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={courseType} onValueChange={setCourseType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Course type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="textbook">Textbook</SelectItem>
          <SelectItem value="course">Course</SelectItem>
          <SelectItem value="reading_group">Reading Group</SelectItem>
          <SelectItem value="classroom">Classroom</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Recently created</SelectItem>
          <SelectItem value="title">Title A-Z</SelectItem>
          <SelectItem value="enrollments">Most popular</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="icon">
        <Filter className="h-4 w-4" />
      </Button>
    </div>
  )
}
