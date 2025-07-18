import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { chatId, content } = await request.json()

    if (!chatId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify user is participant in chat
    const { data: participant } = await supabase
      .from("chat_participants")
      .select("*")
      .eq("chat_id", chatId)
      .eq("user_id", user.id)
      .single()

    if (!participant) {
      return NextResponse.json({ error: "Not authorized to send messages to this chat" }, { status: 403 })
    }

    // Insert message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: user.id,
        content: content.trim(),
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update chat last message time
    await supabase.from("chats").update({ last_message_at: new Date().toISOString() }).eq("id", chatId)

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
