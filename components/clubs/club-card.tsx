import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, User } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

interface ClubCardProps {
  club: {
    id: string
    name: string
    description: string | null
    created_at: string
    profiles: {
      username: string
      full_name: string | null
    } | null
    club_members: { count: number }[]
  }
}

export function ClubCard({ club }: ClubCardProps) {
  const memberCount = club.club_members?.[0]?.count || 0

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{club.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="line-clamp-1">{club.name}</CardTitle>
            <CardDescription className="line-clamp-2">{club.description || "No description provided"}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm text-muted-foreground">
          {club.profiles && (
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Owner: {club.profiles.full_name || club.profiles.username}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{memberCount} members</span>
          </div>

          <div className="text-xs">Created {formatDistanceToNow(new Date(club.created_at), { addSuffix: true })}</div>
        </div>

        <Button asChild className="w-full">
          <Link href={`/clubs/${club.id}`}>View Club</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
