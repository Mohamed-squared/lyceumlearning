"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Loader2, Users } from "lucide-react"

export function ClubCreator() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return

    setIsCreating(true)

    try {
      // Check if club name is available
      const { data: existingClub } = await supabase.from("clubs").select("name").eq("name", name.trim()).single()

      if (existingClub) {
        toast({
          title: "Error",
          description: "A club with this name already exists",
          variant: "destructive",
        })
        setIsCreating(false)
        return
      }

      // Create club
      const { data: club, error } = await supabase
        .from("clubs")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          owner_id: user.id,
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as member
      await supabase.from("club_members").insert({
        club_id: club.id,
        user_id: user.id,
        role: "moderator",
      })

      toast({
        title: "Success!",
        description: "Your club has been created successfully.",
      })

      router.push(`/clubs/${club.id}`)
    } catch (error) {
      console.error("Error creating club:", error)
      toast({
        title: "Error",
        description: "Failed to create club. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Club Details</span>
        </CardTitle>
        <CardDescription>Create a space for learners to collaborate and share knowledge</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateClub} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Club Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Calculus Study Group"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            <div className="text-xs text-muted-foreground text-right">{name.length}/50</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what your club is about, its goals, and what members can expect..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">{description.length}/500</div>
          </div>

          <Button type="submit" disabled={!name.trim() || isCreating} className="w-full">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Club...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Create Club
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
