import { InboxContent } from "@/components/inbox/inbox-content"

export default async function InboxPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">Messages, notifications, and challenge requests</p>
        </div>

        <InboxContent />
      </div>
    </div>
  )
}
