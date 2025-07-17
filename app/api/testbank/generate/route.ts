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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const testbankId = formData.get("testbankId") as string
    const questionCount = Number.parseInt(formData.get("questionCount") as string)
    const difficulty = formData.get("difficulty") as string

    if (!file || !testbankId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check user credits
    const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single()

    const creditsNeeded = Math.ceil(questionCount / 5) // 1 credit per 5 questions

    if (!profile || profile.credits < creditsNeeded) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Deduct credits
    await supabase.rpc("update_user_credits", {
      user_id: user.id,
      amount: -creditsNeeded,
      reason: "AI_GENERATION_COST",
      related_id: testbankId,
    })

    // Process file content
    const fileContent = await file.text()

    // This is a simplified version - in production, you'd integrate with Gemini API
    // For now, we'll create some sample questions
    const sampleQuestions = Array.from({ length: questionCount }, (_, i) => ({
      original_testbank_id: testbankId,
      current_testbank_id: testbankId,
      author_type: "ai" as const,
      question_type: "mcq" as const,
      topic: `topic_${i + 1}`,
      content: `Sample AI-generated question ${i + 1} based on the uploaded content.`,
      options: {
        a: "Option A",
        b: "Option B",
        c: "Option C",
        d: "Option D",
      },
      answer: "a",
      difficulty: difficulty as "easy" | "medium" | "hard",
      keywords: ["sample", "ai-generated"],
    }))

    // Insert questions
    const { error: insertError } = await supabase.from("questions").insert(sampleQuestions)

    if (insertError) {
      throw insertError
    }

    // Create notification
    await supabase.rpc("create_notification", {
      user_id: user.id,
      content: `AI generation completed for your testbank. ${questionCount} questions were generated.`,
      link: `/testbanks/${testbankId}`,
    })

    return NextResponse.json({ success: true, questionsGenerated: questionCount })
  } catch (error) {
    console.error("Error in AI generation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
