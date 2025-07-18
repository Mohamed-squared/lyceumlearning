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

    const { followingId } = await request.json()

    if (!followingId) {
      return NextResponse.json({ error: "Following ID is required" }, { status: 400 })
    }

    if (followingId === user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    // Check if already following
    const { data: existing } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", followingId)
      .single()

    if (existing) {
      return NextResponse.json({ error: "Already following this user" }, { status: 400 })
    }

    // Create the follow relationship
    const { data: follow, error } = await supabase
      .from("follows")
      .insert({
        follower_id: user.id,
        following_id: followingId,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating follow:", error)
      return NextResponse.json({ error: "Failed to follow user" }, { status: 500 })
    }

    return NextResponse.json({ follow })
  } catch (error) {
    console.error("Error in create follow:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
