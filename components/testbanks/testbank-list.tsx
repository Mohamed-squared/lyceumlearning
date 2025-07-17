"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { TestbankCard } from "./testbank-card"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function TestbankList() {
  const supabase = createClient()

  const { data: testbanks, isLoading } = useQuery({
    queryKey: ["testbanks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("testbanks")
        .select(`
          *,
          profiles!testbanks_owner_id_fkey(username, full_name),
          questions(count)
        `)
        .eq("visibility", "opensource")
        .order("created_at", { ascending: false })

      return data || []
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!testbanks || testbanks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No public testbanks available yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {testbanks.map((testbank) => (
        <TestbankCard key={testbank.id} testbank={testbank} />
      ))}
    </div>
  )
}
