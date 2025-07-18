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

    const { name, description } = await request.json()

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Club name is required" }, { status: 400 })
    }

    // Create the club
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        owner_id: user.id,
      })
      .select()
      .single()

    if (clubError) {
      console.error("Error creating club:", clubError)
      return NextResponse.json({ error: "Failed to create club" }, { status: 500 })
    }

    // Add the creator as the first member with owner role
    const { error: memberError } = await supabase.from("club_members").insert({
      club_id: club.id,
      user_id: user.id,
      role: "owner",
    })

    if (memberError) {
      console.error("Error adding club member:", memberError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ club })
  } catch (error) {
    console.error("Error in create club:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
