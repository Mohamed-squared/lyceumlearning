import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
// import { pdfParse } from "pdf-parse" // REMOVED

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// --- helpers ---------------------------------------------------------------

async function fetchPdfBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error(`Unable to download PDF: ${res.statusText}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// --- route handler ---------------------------------------------------------

export async function POST(request: NextRequest): Promise<any> {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: "Unauthorized" }, { status: 401 }
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
        return { error: "No file provided" }, { status: 400 }
      }

      title = titleField || "Generated Testbank"
      description = descriptionField || "AI-generated testbank from uploaded content"

      // Process PDF file
      if (file.type === "application/pdf") {
        try {
          const buffer = await file.arrayBuffer()

          // 👉 dynamic import so pdf-parse is evaluated at runtime, not build time
          const { default: pdfParse } = await import("pdf-parse")
          const data = await pdfParse(Buffer.from(buffer))

          textContent = data.text
        } catch (error) {
          console.error("PDF parsing error:", error)
          return { error: "Failed to parse PDF" }, { status: 400 }
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
      return { error: "No content provided" }, { status: 400 }
    }

    // Generate questions using AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `
    Based on the following content, generate 10 multiple-choice questions with 4 options each.
    Format the response as a JSON array where each question has:
    - topic: string (main topic/subject)
    - content: string (the question text)
    - options: array of 4 strings (A, B, C, D options)
    - answer: string (the correct option letter: A, B, C, or D)
    - difficulty: string (easy, medium, or hard)
    - keywords: array of relevant keywords

    Content:
    ${textContent.substring(0, 8000)} // Limit content to avoid token limits

    Return only valid JSON, no additional text.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const generatedText = response.text()

    let questions
    try {
      questions = JSON.parse(generatedText)
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
      return { error: "Failed to generate valid questions" }, { status: 500 }
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
      return { error: "Failed to create testbank" }, { status: 500 }
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
      return { error: "Failed to save questions" }, { status: 500 }
    }

    // Award credits for creating testbank
    await supabase.rpc("update_user_credits", {
      user_id: user.id,
      amount: 20,
      reason: "AI_TESTBANK_GENERATION",
      related_id: testbank.id,
    })

    return {
      success: true,
      testbank: {
        id: testbank.id,
        title: testbank.title,
        description: testbank.description,
        questionCount: questions.length,
      },
    }
  } catch (error) {
    console.error("Testbank generation error:", error)
    return { error: "Internal server error" }, { status: 500 }
  }
}
