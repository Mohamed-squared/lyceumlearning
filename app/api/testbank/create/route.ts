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

    const { title, description, visibility, generationMethod } = await request.json()

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (title.length > 100) {
      return NextResponse.json({ error: "Title too long" }, { status: 400 })
    }

    if (description && description.length > 500) {
      return NextResponse.json({ error: "Description too long" }, { status: 400 })
    }

    if (!["private", "opensource"].includes(visibility)) {
      return NextResponse.json({ error: "Invalid visibility" }, { status: 400 })
    }

    if (!["manual", "ai"].includes(generationMethod)) {
      return NextResponse.json({ error: "Invalid generation method" }, { status: 400 })
    }

    // Create the testbank
    const { data: testbank, error } = await supabase
      .from("testbanks")
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        visibility,
        generation_method: generationMethod,
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
