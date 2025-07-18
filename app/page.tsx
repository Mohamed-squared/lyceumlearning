import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, Trophy, Zap, Star, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b container mx-auto">
        <Link className="flex items-center justify-center" href="/">
          <BookOpen className="h-6 w-6 mr-2 text-primary" />
          <span className="font-bold">Lyceum</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                Welcome to Lyceum
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                The comprehensive educational platform for courses, testbanks, and collaborative learning. Create,
                share, and master knowledge together.
              </p>
            </div>
            <div className="space-x-4">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/courses">Explore Courses</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <Card>
              <CardHeader>
                <BookOpen className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Interactive Courses</CardTitle>
                <CardDescription>
                  Create and enroll in comprehensive courses with rich content, assignments, and progress tracking.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Trophy className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>AI-Powered Testbanks</CardTitle>
                <CardDescription>
                  Generate intelligent question banks using AI, with support for multiple question types and difficulty
                  levels.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Collaborative Learning</CardTitle>
                <CardDescription>
                  Join clubs, follow peers, and engage in discussions to enhance your learning experience.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Gamified Learning Experience</h2>
              <p className="mx-auto max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Earn credits, challenge friends, and track your progress with our comprehensive gamification system.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 mt-8">
              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 mb-2 text-yellow-500" />
                  <CardTitle>Credit System</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Earn credits by creating content, completing assignments, and engaging with the community. Use
                    credits for AI features and challenges.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Star className="h-8 w-8 mb-2 text-purple-500" />
                  <CardTitle>Challenges</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Challenge other users to learning competitions and win credits. Compete in course completion races
                    and knowledge tests.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t container mx-auto">
        <p className="text-xs text-muted-foreground">© 2024 Lyceum. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/tos">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
