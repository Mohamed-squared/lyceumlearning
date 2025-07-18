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

    // Check if user is admin (RLS on the RPC function also enforces this)
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { userId, action } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let error
    if (action === "ban") {
      ;({ error } = await supabase.rpc("ban_user", { user_id_input: userId }))
    } else if (action === "unban") {
      ;({ error } = await supabase.rpc("unban_user", { user_id_input: userId }))
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    if (error) {
      console.error("Error in ban user rpc:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in ban user route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
