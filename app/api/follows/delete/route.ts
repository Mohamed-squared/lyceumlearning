import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
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

    const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", followingId)

    if (error) {
      console.error("Error deleting follow:", error)
      return NextResponse.json({ error: "Failed to unfollow user" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in delete follow:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
