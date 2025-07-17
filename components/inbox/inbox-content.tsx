"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessagesList } from "./messages-list"
import { NotificationsList } from "./notifications-list"
import { ChallengesList } from "./challenges-list"

export function InboxContent() {
  return (
    <Tabs defaultValue="messages" className="space-y-4">
      <TabsList>
        <TabsTrigger value="messages">Messages</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="challenges">Challenges</TabsTrigger>
      </TabsList>

      <TabsContent value="messages">
        <MessagesList />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationsList />
      </TabsContent>

      <TabsContent value="challenges">
        <ChallengesList />
      </TabsContent>
    </Tabs>
  )
}
