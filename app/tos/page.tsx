import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"

export default function TermsOfServicePage() {
  return (
    <>
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
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
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing and using Lyceum, you accept and agree to be bound by the terms and provision of this
                agreement.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">2. User-Generated Content</h2>
              <p className="text-muted-foreground mb-3">
                Users are responsible for all content they upload, including posts, course materials, testbanks, and
                comments. You must:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Respect copyright laws and intellectual property rights</li>
                <li>Not upload harmful, offensive, or illegal content</li>
                <li>Ensure you have the right to share any materials you upload</li>
                <li>Take responsibility for the accuracy of your content</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                Lyceum acts as a hosting platform and is not responsible for user-generated content. We are a host, not a
                publisher.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Reporting and Moderation</h2>
              <p className="text-muted-foreground mb-3">Lyceum operates on a report-based moderation system:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Users can report content that violates these terms</li>
                <li>Our admin team will review reports within a reasonable timeframe (typically within 4 weeks)</li>
                <li>We are not obligated to pre-screen content but will take action on valid reports</li>
                <li>False or malicious reports may result in account penalties</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Account Termination</h2>
              <p className="text-muted-foreground">
                Lyceum reserves the right to suspend or terminate user accounts and remove content that violates these
                terms. Reasons for termination may include, but are not limited to, harassment, copyright infringement,
                spam, or other violations.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Ownership of Orphaned Content</h2>
              <p className="text-muted-foreground">
                When a user account is deleted or banned, their content may become "orphaned." In such cases:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Public content (courses, testbanks marked as "opensource") becomes available for community use</li>
                <li>Other users may request to claim ownership of orphaned content</li>
                <li>Admin approval is required for content ownership transfers</li>
                <li>Private content may be permanently deleted at admin discretion</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Credit System and Virtual Currency</h2>
              <p className="text-muted-foreground">
                Lyceum uses a credit system for gamification and access to premium features. Credits have no real-world
                monetary value and cannot be exchanged for cash or transferred between accounts outside the platform's
                intended functionality.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">7. AI-Generated Content</h2>
              <p className="text-muted-foreground">
                Lyceum uses AI to generate educational content including questions and feedback. While we strive for
                accuracy, AI-generated content may contain errors. Users should verify important information
                independently.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Privacy and Data Protection</h2>
              <p className="text-muted-foreground">
                Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and
                protect your information.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Lyceum is provided "as-is" without warranties of any kind. We do not guarantee the accuracy, completeness,
                or reliability of any content on the platform. Users assume all risks associated with using the service.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes, and
                continued use of the platform constitutes acceptance of the updated terms.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have questions about these Terms of Service, please contact us through the platform's support
                system or report mechanism.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
