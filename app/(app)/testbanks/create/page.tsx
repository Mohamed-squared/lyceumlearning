import { TestbankCreator } from "@/components/testbanks/testbank-creator"

export default async function CreateTestbankPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Testbank</h1>
          <p className="text-muted-foreground">Generate questions using AI or create them manually</p>
        </div>

        <TestbankCreator />
      </div>
    </div>
  )
}
