import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const runtime = "edge" // Use edge runtime for this route

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type")
    let textContent = ""
    let title = ""
    let description = ""

    if (contentType?.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get("file") as File
      const titleField = formData.get("title") as string
      const descriptionField = formData.get("description") as string

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      title = titleField || "Generated Testbank"
      description = descriptionField || "AI-generated testbank from uploaded content"

      // Process PDF file (dynamically import to support edge runtime)
      if (file.type === "application/pdf") {
        try {
          const { default: pdf } = await import("pdf-parse/lib/pdf-parse.js")
          const buffer = await file.arrayBuffer()
          const data = await pdf(Buffer.from(buffer))
          textContent = data.text
        } catch (error) {
          console.error("PDF parsing error:", error)
          return NextResponse.json({ error: "Failed to parse PDF" }, { status: 400 })
        }
      } else {
        // Handle text files
        textContent = await file.text()
      }
    } else {
      // Handle JSON request
      const body = await request.json()
      textContent = body.content || ""
      title = body.title || "Generated Testbank"
      description = body.description || "AI-generated testbank"
    }

    if (!textContent.trim()) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 })
    }

    // Generate questions using AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `
    Based on the following content, generate 10 multiple-choice questions with 4 options each.
    Format the response as a JSON array of objects. Each object must have these exact keys:
    "topic": string (main topic/subject of the question)
    "content": string (the question text)
    "options": array of 4 strings (A, B, C, D options)
    "answer": string (the correct option letter: A, B, C, or D)
    "difficulty": string (must be one of: easy, medium, hard)
    "keywords": array of relevant string keywords

    Content:
    ${textContent.substring(0, 8000)} // Limit content to avoid token limits

    IMPORTANT: Your entire response must be ONLY the raw JSON array, starting with [ and ending with ]. Do not include any other text, markdown, or explanations.
    `
    const result = await model.generateContent(prompt)
    const response = await result.response
    const generatedText = response.text()

    let questions
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedText = generatedText.replace(/```json/g, "").replace(/```/g, "").trim()
      questions = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, "Response was:", generatedText)
      return NextResponse.json({ error: "Failed to generate valid questions from AI" }, { status: 500 })
    }

    // Create testbank in database
    const { data: testbank, error: testbankError } = await supabase
      .from("testbanks")
      .insert({
        title,
        description,
        owner_id: user.id,
        visibility: "private",
        generation_method: "ai",
        review_status: "not_reviewed",
      })
      .select()
      .single()

    if (testbankError) {
      console.error("Testbank creation error:", testbankError)
      return NextResponse.json({ error: "Failed to create testbank" }, { status: 500 })
    }

    // Insert questions
    const questionsToInsert = questions.map((q: any) => ({
      original_testbank_id: testbank.id,
      current_testbank_id: testbank.id,
      author_type: "ai",
      type: "mcq",
      topic: q.topic || "General",
      content: q.content,
      options: q.options,
      answer: q.answer,
      difficulty: q.difficulty || "medium",
      keywords: q.keywords || [],
    }))

    const { error: questionsError } = await supabase.from("questions").insert(questionsToInsert)

    if (questionsError) {
      console.error("Questions insertion error:", questionsError)
      // Attempt to clean up the created testbank if questions fail to insert
      await supabase.from("testbanks").delete().eq("id", testbank.id)
      return NextResponse.json({ error: "Failed to save questions" }, { status: 500 })
    }

    // Award credits for creating testbank
    await supabase.rpc("update_user_credits", {
      user_id_input: user.id,
      amount_input: 20,
      reason_input: "AI_TESTBANK_GENERATION",
      related_id_input: testbank.id,
    })

    return NextResponse.json({
      success: true,
      testbank: {
        id: testbank.id,
        title: testbank.title,
        description: testbank.description,
        questionCount: questions.length,
      },
    })
  } catch (error) {
    console.error("Testbank generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
