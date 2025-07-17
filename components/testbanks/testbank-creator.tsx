"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Wand2, FileText, Upload, Loader2 } from "lucide-react"

export function TestbankCreator() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"private" | "restricted" | "opensource">("private")
  const [generationMethod, setGenerationMethod] = useState<"ai" | "manual">("manual")
  const [isCreating, setIsCreating] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [questionCount, setQuestionCount] = useState(10)
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")

  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const handleCreateTestbank = async () => {
    if (!user || !title.trim()) return

    setIsCreating(true)

    try {
      // Create testbank
      const { data: testbank, error } = await supabase
        .from("testbanks")
        .insert({
          owner_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          visibility,
          generation_method: generationMethod,
        })
        .select()
        .single()

      if (error) throw error

      if (generationMethod === "ai" && file) {
        // Start AI generation process
        await handleAIGeneration(testbank.id)
      }

      toast({
        title: "Testbank created!",
        description:
          generationMethod === "ai"
            ? "AI generation started. You'll be notified when complete."
            : "Your testbank is ready for manual question entry.",
      })

      router.push(`/testbanks/${testbank.id}`)
    } catch (error) {
      console.error("Error creating testbank:", error)
      toast({
        title: "Error",
        description: "Failed to create testbank. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleAIGeneration = async (testbankId: string) => {
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("testbankId", testbankId)
    formData.append("questionCount", questionCount.toString())
    formData.append("difficulty", difficulty)

    try {
      const response = await fetch("/api/testbank/generate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to start AI generation")
      }
    } catch (error) {
      console.error("Error starting AI generation:", error)
      toast({
        title: "Warning",
        description: "Testbank created but AI generation failed to start.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Testbank Details</CardTitle>
        <CardDescription>Configure your testbank settings and generation method</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Calculus I - Chapter 1-5"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this testbank covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                  <SelectItem value="opensource">Open Source</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Generation Method</Label>
              <Select value={generationMethod} onValueChange={(value: any) => setGenerationMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Entry</SelectItem>
                  <SelectItem value="ai">AI Generated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Tabs value={generationMethod} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" onClick={() => setGenerationMethod("manual")}>
              <FileText className="mr-2 h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="ai" onClick={() => setGenerationMethod("ai")}>
              <Wand2 className="mr-2 h-4 w-4" />
              AI Generated
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Create your testbank and add questions manually. You'll be able to add questions after the testbank is
                  created.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Upload Content</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <div className="mt-4">
                      <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-primary hover:underline">Click to upload</span>
                        <span className="text-sm text-muted-foreground"> or drag and drop</span>
                      </Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.txt,.srt"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">PDF, TXT, or SRT files up to 10MB</p>
                  </div>
                  {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Questions to Generate</Label>
                    <Input
                      type="number"
                      min="5"
                      max="100"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number.parseInt(e.target.value) || 10)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Difficulty Level</Label>
                    <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleCreateTestbank}
          disabled={!title.trim() || isCreating || (generationMethod === "ai" && !file)}
          className="w-full"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              {generationMethod === "ai" ? <Wand2 className="mr-2 h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
              Create Testbank
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
