"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "./user-management"
import { CourseManagement } from "./course-management"
import { ReportQueue } from "./report-queue"
import { AdminStats } from "./admin-stats"

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      <AdminStats />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="courses">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="reports">
          <ReportQueue />
        </TabsContent>
      </Tabs>
    </div>
  )
}
