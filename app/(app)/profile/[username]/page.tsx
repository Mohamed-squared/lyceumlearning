import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileTabs } from "@/components/profile/profile-tabs"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("*").eq("username", params.username).single()

  if (!profile) {
    notFound()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <ProfileHeader profile={profile} />
        <ProfileTabs profile={profile} />
      </div>
    </div>
  )
}
