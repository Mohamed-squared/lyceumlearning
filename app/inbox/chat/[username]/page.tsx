import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { MainNav } from "@/components/layout/main-nav"
import { ChatInterface } from "@/components/chat/chat-interface"

interface ChatPageProps {
  params: {
    username: string
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: otherUser } = await supabase.from("profiles").select("*").eq("username", params.username).single()

  if (!otherUser) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container max-w-4xl py-6">
        <ChatInterface otherUser={otherUser} />
      </main>
    </div>
  )
}
