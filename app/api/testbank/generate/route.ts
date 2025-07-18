import type { NextRequest } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

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

export async function POST(req: NextRequest) {
  try {
    let pdfBuffer: Buffer | null = null

    // 1. Handle multipart/form-data upload (preferred from client)
    if (req.headers.get("content-type")?.startsWith("multipart/form-data")) {
      const formData = await req.formData()
      const file = formData.get("file")
      if (file && file instanceof Blob) {
        pdfBuffer = Buffer.from(await file.arrayBuffer())
      }
    } else {
      // 2. Handle JSON body with { pdfUrl: string }
      const body = (await req.json().catch(() => null)) as { pdfUrl?: string } | null
      if (body?.pdfUrl) {
        pdfBuffer = await fetchPdfBuffer(body.pdfUrl)
      }
    }

    if (!pdfBuffer) {
      return new Response(JSON.stringify({ error: "No PDF provided" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      })
    }

    // Dynamic import so webpack doesn’t load it at build time
    const pdfParse = (await import("pdf-parse")).default as typeof import("pdf-parse").default
    const { text } = await pdfParse(pdfBuffer)

    // -----------------------------------------------------------------------
    // TODO: Replace the stub below with your real prompt & Supabase storage
    // -----------------------------------------------------------------------

    const { text: questions } = await generateText({
      model: openai("gpt-4o"),
      system:
        "You are an expert educator. Generate a JSON array of 5 high-quality exam questions based on the input text.",
      prompt: text.slice(0, 8000), // OpenAI 4o ~128k context; we keep it small for now
    })

    return Response.json({
      success: true,
      questions: JSON.parse(questions), // expect the model to return a JSON array
    })
  } catch (err) {
    console.error("[/api/testbank/generate] error:", err)
    return new Response(JSON.stringify({ error: "Failed to generate testbank" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })
  }
}
