import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const { title, description, visibility } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const { data: testbank, error } = await supabase
      .from("testbanks")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        visibility: visibility || "private",
        owner_id: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating testbank:", error)
      return NextResponse.json({ error: "Failed to create testbank" }, { status: 500 })
    }

    return NextResponse.json({ testbank })
  } catch (error) {
    console.error("Error in create testbank:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
