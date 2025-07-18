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

  const { user } = useAuth()
  const router = useRouter()

  const handleCreateTestbank = async () => {
    if (!user || !title.trim()) return

    setIsCreating(true)

    try {
      if (generationMethod === "ai" && file) {
        // Handle AI generation via API route
        const formData = new FormData()
        formData.append("file", file)
        formData.append("title", title)
        formData.append("description", description)

        const response = await fetch("/api/testbank/generate", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || "Failed to generate testbank.")
        }

        toast({
          title: "Testbank generation started!",
          description: "Your AI-generated questions will be ready shortly.",
        })
        router.push(`/testbanks/${result.testbank.id}`)

      } else {
        // Handle manual creation
        const { createClient } = await import("@/lib/supabase/client")
        const supabase = createClient()

        const { data: testbank, error } = await supabase
          .from("testbanks")
          .insert({
            owner_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            visibility,
            generation_method: "manual",
          })
          .select()
          .single()

        if (error) throw error

        toast({
          title: "Testbank created!",
          description: "Your testbank is ready for manual question entry.",
        })
        router.push(`/testbanks/${testbank.id}`)
      }
    } catch (error: any) {
      console.error("Error creating testbank:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create testbank. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
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
               <Tabs value={generationMethod} onValueChange={setGenerationMethod} className="w-full">
                 <TabsList className="grid w-full grid-cols-2">
                   <TabsTrigger value="manual"><FileText className="mr-2 h-4 w-4" />Manual</TabsTrigger>
                   <TabsTrigger value="ai"><Wand2 className="mr-2 h-4 w-4" />AI</TabsTrigger>
                 </TabsList>
               </Tabs>
            </div>
          </div>
        </div>

        {generationMethod === 'manual' && (
           <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  Create your testbank and add questions manually. You'll be able to add questions after the testbank is
                  created.
                </p>
              </CardContent>
            </Card>
        )}

        {generationMethod === 'ai' && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Upload Content (PDF, TXT)</Label>
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
                        accept=".pdf,.txt"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </div>
                  </div>
                  {file && <p className="text-sm text-muted-foreground mt-2">Selected: {file.name}</p>}
                </div>
              </CardContent>
            </Card>
        )}

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
