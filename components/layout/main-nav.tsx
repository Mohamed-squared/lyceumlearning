"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Home, Users, MessageSquare, Trophy, GraduationCap, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { UserNav } from "./user-nav"
import { NotificationDropdown } from "./notification-dropdown"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/components/providers/auth-provider"

const navigation = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Courses", href: "/courses", icon: GraduationCap },
  { name: "Testbanks", href: "/testbanks", icon: BookOpen },
  { name: "Clubs", href: "/clubs", icon: Users },
  { name: "Social", href: "/social", icon: UserPlus },
  { name: "Inbox", href: "/inbox", icon: MessageSquare },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
]

export function MainNav() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) {
    return null
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/home" className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6" />
              <span className="font-bold text-xl">Lyceum</span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                      pathname === item.href ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <NotificationDropdown />
            <UserNav />
          </div>
        </div>
      </div>
    </nav>
  )
}
