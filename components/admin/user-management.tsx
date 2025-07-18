"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, Search, Shield, Coins, UserX, UserCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/hooks/use-toast"

export function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showBanDialog, setShowBanDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [banAction, setBanAction] = useState<"ban" | "unban">("ban")
  const supabase = createClient()
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", searchQuery],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      }

      const { data } = await query
      return data || []
    },
  })

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin"

      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["admin-users"] })

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  const handleEditCredits = async (userId: string, newCredits: number) => {
    try {
      const { error } = await supabase.from("profiles").update({ credits: newCredits }).eq("id", userId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ["admin-users"] })

      toast({
        title: "Success",
        description: "User credits updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update credits",
        variant: "destructive",
      })
    }
  }

  const handleBanUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch("/api/admin/ban-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          action: banAction,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user ban status")
      }

      queryClient.invalidateQueries({ queryKey: ["admin-users"] })

      toast({
        title: "Success",
        description: `User ${banAction === "ban" ? "banned" : "unbanned"} successfully`,
      })

      setShowBanDialog(false)
      setSelectedUser(null)
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${banAction} user`,
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ""} />
                          <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.full_name || user.username}</div>
                          <div className="text-sm text-muted-foreground">@{user.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_banned ? "destructive" : "success"}>
                        {user.is_banned ? "Banned" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Coins className="h-4 w-4 text-yellow-500" />
                        <span>{user.credits}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleAdmin(user.id, user.role)}>
                            <Shield className="mr-2 h-4 w-4" />
                            {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const newCredits = prompt("Enter new credit amount:", user.credits.toString())
                              if (newCredits && !isNaN(Number.parseInt(newCredits))) {
                                handleEditCredits(user.id, Number.parseInt(newCredits))
                              }
                            }}
                          >
                            <Coins className="mr-2 h-4 w-4" />
                            Edit Credits
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user)
                              setBanAction(user.is_banned ? "unban" : "ban")
                              setShowBanDialog(true)
                            }}
                            className={user.is_banned ? "text-green-600" : "text-destructive"}
                          >
                            {user.is_banned ? (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Unban User
                              </>
                            ) : (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Ban User
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{banAction === "ban" ? "Ban User" : "Unban User"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {banAction} {selectedUser?.username}?
              {banAction === "ban" && " This will prevent them from accessing the platform."}
              {banAction === "unban" && " This will restore their access to the platform."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanUser}
              className={
                banAction === "ban" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
              }
            >
              {banAction === "ban" ? "Ban User" : "Unban User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
