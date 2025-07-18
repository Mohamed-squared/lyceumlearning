"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserSearch } from "./user-search"
import { FriendRequests } from "./friend-requests"
import { FriendsList } from "./friends-list"

export function SocialContent() {
  const [activeTab, setActiveTab] = useState("discover")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="discover">Discover Users</TabsTrigger>
        <TabsTrigger value="requests">Friend Requests</TabsTrigger>
        <TabsTrigger value="friends">My Friends</TabsTrigger>
      </TabsList>

      <TabsContent value="discover" className="space-y-6">
        <UserSearch />
      </TabsContent>

      <TabsContent value="requests" className="space-y-6">
        <FriendRequests />
      </TabsContent>

      <TabsContent value="friends" className="space-y-6">
        <FriendsList />
      </TabsContent>
    </Tabs>
  )
}
