"use client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, X, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"

export function ReportQueue() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select(`
          *,
          profiles!reports_reporter_id_fkey(username, full_name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      return data || []
    },
  })

  const handleResolveReport = async (reportId: string, status: "resolved" | "dismissed") => {
    try {
      const { error } = await supabase.from("reports").update({ status }).eq("id", reportId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["admin-reports"] })
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] })

      toast({
        title: "Success",
        description: `Report ${status}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reporter</TableHead>
              <TableHead>Content Type</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports?.map((report) => (
              <TableRow key={report.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{report.profiles?.full_name || report.profiles?.username}</div>
                    <div className="text-sm text-muted-foreground">@{report.profiles?.username}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{report.reported_content_type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="text-sm line-clamp-2">{report.reason}</p>
                  </div>
                </TableCell>
                <TableCell>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Navigate to reported content
                        const contentType = report.reported_content_type
                        const contentId = report.reported_content_id
                        let url = ""

                        switch (contentType) {
                          case "post":
                            url = `/posts/${contentId}`
                            break
                          case "course":
                            url = `/courses/${contentId}`
                            break
                          case "user":
                            url = `/profile/${contentId}`
                            break
                          default:
                            return
                        }

                        window.open(url, "_blank")
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleResolveReport(report.id, "resolved")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleResolveReport(report.id, "dismissed")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {reports?.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No pending reports</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
