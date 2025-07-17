import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, User, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface TestbankCardProps {
  testbank: {
    id: string
    title: string
    description: string | null
    visibility: string
    generation_method: string
    created_at: string
    profiles: {
      username: string
      full_name: string | null
    } | null
    questions: { count: number }[]
  }
}

export function TestbankCard({ testbank }: TestbankCardProps) {
  const questionCount = testbank.questions?.[0]?.count || 0

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="line-clamp-2">{testbank.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {testbank.description || "No description provided"}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="ml-2">
            {testbank.visibility}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span>{questionCount} questions</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {testbank.generation_method}
          </Badge>
        </div>

        {testbank.profiles && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>by {testbank.profiles.full_name || testbank.profiles.username}</span>
          </div>
        )}

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDistanceToNow(new Date(testbank.created_at), { addSuffix: true })}</span>
        </div>

        <Button asChild className="w-full">
          <Link href={`/testbanks/${testbank.id}`}>View Testbank</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
