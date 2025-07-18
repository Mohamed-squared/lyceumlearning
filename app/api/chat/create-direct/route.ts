import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { otherUserId } = await request.json()

    if (!otherUserId) {
      return NextResponse.json({ error: "Other user ID is required" }, { status: 400 })
    }

    // Use the database function to get or create direct chat
    const { data: chatId, error } = await supabase.rpc("get_or_create_direct_chat", {
      user1_id: user.id,
      user2_id: otherUserId,
    })

    if (error) {
      console.error("Error creating direct chat:", error)
      return NextResponse.json({ error: "Failed to create chat" }, { status: 500 })
    }

    return NextResponse.json({ chatId })
  } catch (error) {
    console.error("Error in create-direct chat:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
