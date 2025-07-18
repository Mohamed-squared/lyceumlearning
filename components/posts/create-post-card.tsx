"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"
import { ImageIcon, Loader2 } from "lucide-react"

export function CreatePostCard() {
  const [content, setContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const supabase = createClient()
  const queryClient = useQueryClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !content.trim()) return

    setIsSubmitting(true)

    try {
      let imageUrl = null

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(filePath)

        imageUrl = publicUrl
      }

      // Create post
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
      })

      if (error) throw error

      // Reset form
      setContent("")
      setImageFile(null)
      const fileInput = document.getElementById('image') as HTMLInputElement;
      if (fileInput) fileInput.value = "";


      // Refresh feed
      queryClient.invalidateQueries({ queryKey: ["home-feed"] })
      queryClient.invalidateQueries({ queryKey: ["profile-posts", user.id] })
      queryClient.invalidateQueries({ queryKey: ["profile-stats", user.id] })


      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      })
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share something with the community</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground mt-1 text-right">{content.length}/500</div>
          </div>

          <div>
            <Label htmlFor="image" className="cursor-pointer">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground">
                <ImageIcon className="h-4 w-4" />
                <span>Add image (optional)</span>
              </div>
            </Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {imageFile && <div className="mt-2 text-sm text-muted-foreground">Selected: {imageFile.name}</div>}
          </div>

          <Button type="submit" disabled={!content.trim() || isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              "Share Post"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
