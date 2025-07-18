"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, BookOpen, Users, Trophy, MessageCircle, TrendingUp, Menu } from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "./user-nav"
import { NotificationDropdown } from "./notification-dropdown"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Don't show nav on auth pages
  if (pathname?.includes("/auth")) {
    return null
  }

  if (!user) return null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">Lyceum</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-4">
            <NotificationDropdown />
            <ThemeToggle />
            <UserNav />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 text-lg font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BookOpen className="h-6 w-6" />
                    <span>Lyceum</span>
                  </Link>

                  <nav className="flex flex-col space-y-2">
                    {navigation.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                          pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </nav>

                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <NotificationDropdown />
                      <UserNav />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
