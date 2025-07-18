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

    const { requestId, action } = await request.json()

    if (!requestId || !action) {
      return NextResponse.json({ error: "Request ID and action are required" }, { status: 400 })
    }

    if (!["accepted", "declined"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const { data: friendRequest, error } = await supabase
      .from("friend_requests")
      .update({ status: action })
      .eq("id", requestId)
      .eq("receiver_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error responding to friend request:", error)
      return NextResponse.json({ error: "Failed to respond to friend request" }, { status: 500 })
    }

    return NextResponse.json({ friendRequest })
  } catch (error) {
    console.error("Error in respond to friend request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
