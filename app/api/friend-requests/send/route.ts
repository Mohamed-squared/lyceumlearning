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

    const { receiverId } = await request.json()

    if (!receiverId) {
      return NextResponse.json({ error: "Receiver ID is required" }, { status: 400 })
    }

    if (receiverId === user.id) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 })
    }

    // Check if friend request already exists
    const { data: existingRequest } = await supabase
      .from("friend_requests")
      .select("id, status")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`,
      )
      .single()

    if (existingRequest) {
      return NextResponse.json({ error: "Friend request already exists" }, { status: 400 })
    }

    // Check if already friends
    const { data: existingFriendship } = await supabase
      .from("friendships")
      .select("id")
      .or(`and(user1_id.eq.${Math.min(user.id, receiverId)},user2_id.eq.${Math.max(user.id, receiverId)})`)
      .single()

    if (existingFriendship) {
      return NextResponse.json({ error: "Already friends" }, { status: 400 })
    }

    const { data: friendRequest, error } = await supabase
      .from("friend_requests")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error sending friend request:", error)
      return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 })
    }

    return NextResponse.json({ friendRequest })
  } catch (error) {
    console.error("Error in send friend request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
