"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, BookOpen, Users, Trophy, MessageCircle, TrendingUp } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "./user-nav"
import { NotificationDropdown } from "./notification-dropdown"

const navigation = [
  { name: "Home", href: "/home", icon: Home },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "Testbanks", href: "/testbanks", icon: Trophy },
  { name: "Clubs", href: "/clubs", icon: Users },
  { name: "Inbox", href: "/inbox", icon: MessageCircle },
  { name: "Leaderboard", href: "/leaderboard", icon: TrendingUp },
]

export function MainNav() {
  const pathname = usePathname()
  const { user, profile } = useAuth()

  if (!user) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <BookOpen className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">Lyceum</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href ? "text-foreground" : "text-foreground/60",
                )}
              >
                <span className="flex items-center space-x-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <NotificationDropdown />
            <ThemeToggle />
            <UserNav />
          </nav>
        </div>
      </div>
    </header>
  )
}
