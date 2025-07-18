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

    const { title, description, visibility, generationMethod, recommendedUsage } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const { data: testbank, error } = await supabase
      .from("testbanks")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        owner_id: user.id,
        visibility: visibility || "private",
        generation_method: generationMethod || "manual",
        recommended_usage: recommendedUsage || "full_manual",
        review_status: "not_reviewed",
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
