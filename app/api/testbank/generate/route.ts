import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import pdfParse from "pdf-parse"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

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
    const file = formData.get("file") as File | null
    const testbankId = formData.get("testbankId") as string
    const questionCount = Number.parseInt(formData.get("questionCount") as string)
    const difficulty = formData.get("difficulty") as string
    const manualContent = formData.get("manualContent") as string | null

    if (!testbankId || !questionCount || !difficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!file && !manualContent) {
      return NextResponse.json({ error: "Either a file or manual content must be provided" }, { status: 400 })
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

    let contentForAI = ""

    try {
      if (file) {
        if (file.type === "application/pdf") {
          const buffer = await file.arrayBuffer()
          const pdfData = await pdfParse(Buffer.from(buffer))
          contentForAI = pdfData.text
        } else {
          contentForAI = await file.text()
        }
      } else if (manualContent) {
        contentForAI = manualContent
      }

      // Initialize Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Construct detailed prompt
      const prompt = `
You are an expert educator and question generator. Generate exactly ${questionCount} multiple-choice questions based on the following content.

Content:
${contentForAI}

Requirements:
1. Generate exactly ${questionCount} questions
2. Difficulty level: ${difficulty}
3. Each question must be multiple choice with 4 options (A, B, C, D)
4. Include varied topics from the content
5. Questions should test understanding, not just memorization
6. Return ONLY a valid JSON array with no additional text or formatting

Format each question as:
{
  "topic": "specific topic from content",
  "content": "the question text",
  "options": {
    "A": "option A text",
    "B": "option B text", 
    "C": "option C text",
    "D": "option D text"
  },
  "answer": "A" (the correct option),
  "keywords": ["keyword1", "keyword2"]
}

Return only the JSON array, no other text.
`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Parse AI response
      let generatedQuestions: any[]
      try {
        // Clean the response to extract only the JSON array
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
          throw new Error("No JSON array found in response")
        }
        generatedQuestions = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError)
        throw new Error("Failed to parse AI response")
      }

      // Validate and map to database schema
      const questionsToInsert = generatedQuestions.slice(0, questionCount).map((q: any) => ({
        original_testbank_id: testbankId,
        current_testbank_id: testbankId,
        author_id: user.id,
        author_type: "ai" as const,
        type: "mcq" as const,
        topic: q.topic || "General",
        content: q.content,
        options: q.options,
        answer: q.answer,
        difficulty: difficulty as "easy" | "medium" | "hard",
        keywords: q.keywords || ["ai-generated", difficulty],
        marking_method: "allow_ai" as const,
      }))

      // Insert questions
      const { error: insertError } = await supabase.from("questions").insert(questionsToInsert)

      if (insertError) {
        console.error("Database insert error:", insertError)
        throw insertError
      }

      // Create notification
      await supabase.rpc("create_notification", {
        user_id: user.id,
        content: `AI generation completed for your testbank. ${questionsToInsert.length} questions were generated.`,
        link: `/testbanks/${testbankId}`,
      })

      return NextResponse.json({
        success: true,
        questionsGenerated: questionsToInsert.length,
        message: `Successfully generated ${questionsToInsert.length} questions`,
      })
    } catch (aiError) {
      console.error("AI generation failed:", aiError)

      // Refund credits if AI generation fails
      await supabase.rpc("update_user_credits", {
        user_id: user.id,
        amount: creditsNeeded,
        reason: "AI_GENERATION_REFUND",
        related_id: testbankId,
      })

      return NextResponse.json(
        {
          error: "AI generation failed. Credits have been refunded.",
          details: aiError instanceof Error ? aiError.message : "Unknown error",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in AI generation:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
