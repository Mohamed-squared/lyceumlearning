import { Suspense } from "react"
import { TestbankList } from "@/components/testbanks/testbank-list"
import { TestbankFilters } from "@/components/testbanks/testbank-filters"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default async function TestbanksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testbanks</h1>
          <p className="text-muted-foreground">Browse and create question banks for your courses</p>
        </div>
        <Button asChild>
          <Link href="/testbanks/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Testbank
          </Link>
        </Button>
      </div>

      <TestbankFilters />

      <Suspense fallback={<div>Loading testbanks...</div>}>
        <TestbankList />
      </Suspense>
    </div>
  )
}
