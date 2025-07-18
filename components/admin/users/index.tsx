"use client";
import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LoadingOverlay } from "@/components/ui/loading-page";
import { MoreHorizontal, UserCheck, UserX, Settings } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  created_at: string;
  allowed: boolean;
  avatar_url?: string;
  role: string;
}

export default function AdminUsersClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [pendingAllowed, setPendingAllowed] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const roles = ["admin", "user", "investor"];

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filter && filter !== "all") params.append("filter", filter);
    params.append("page", String(page));
    params.append("limit", String(pageSize));
    const res = await fetch(`/api/admin/users?${params.toString()}`);
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [search, filter, page]);

  const handleToggleAllowed = async (id: string, allowed: boolean) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, allowed }),
    });
    fetchUsers();
  };

  const handleUpdateRole = async (id: string, role: string) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role }),
    });
    fetchUsers();
  };

  const handleRequestToggleAllowed = (user: User, allowed: boolean) => {
    setPendingUser(user);
    setPendingAllowed(allowed);
    setShowConfirmDialog(true);
  };

  const handleConfirmToggleAllowed = async () => {
    if (pendingUser) {
      await handleToggleAllowed(pendingUser.id, pendingAllowed);
      setPendingUser(null);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground text-sm">SprintiQ users overview</p>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:w-64"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="allowed">Allowed</SelectItem>
            <SelectItem value="not_allowed">Not Allowed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="relative rounded-xl p-0 md:p-6 shadow-lg border workspace-border overflow-x-auto">
        {loading && <LoadingOverlay />}
        <table className="min-w-full text-sm">
          <thead>
            <tr className="workspace-sidebar-text">
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Created At</th>
              <th className="px-4 py-3 text-left">Allowed</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t workspace-border hover:workspace-hover cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3 flex items-center gap-3 min-w-[180px]">
                  <Avatar className="group-hover:scale-105 duration-300">
                    {user.avatar_url ? (
                      <AvatarImage src={user.avatar_url} alt={user.name} />
                    ) : (
                      <AvatarFallback className="bg-emerald-500/10 text-emerald-600 font-bold">
                        {user.name
                          ? user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                          : "U"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-semibold workspace-sidebar-text group-hover:scale-105 duration-300 transition-colors">
                    {user.name}
                  </span>
                </td>
                <td className="px-4 py-3 workspace-sidebar-text group-hover:scale-105 duration-300">
                  {user.email}
                </td>
                <td className="px-4 py-3 workspace-sidebar-text group-hover:scale-105 duration-300">
                  {user.company}
                </td>
                <td className="px-4 py-3 workspace-sidebar-text group-hover:scale-105 duration-300">
                  <Select
                    value={user.role}
                    onValueChange={(newRole) =>
                      handleUpdateRole(user.id, newRole)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 workspace-sidebar-text group-hover:scale-105 duration-300">
                  {new Date(user.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 group-hover:scale-105 duration-300">
                  <span
                    className={`px-2 py-1 rounded-md text-xs ${
                      user.allowed
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                    }`}
                  >
                    {user.allowed ? "Allowed" : "Not Allowed"}
                  </span>
                </td>
                <td className="px-4 py-3 group-hover:scale-105 duration-300">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() =>
                          handleRequestToggleAllowed(user, !user.allowed)
                        }
                      >
                        {user.allowed ? (
                          <>
                            <UserX className="h-4 w-4 text-red-500" />
                            <span className="text-red-600">Revoke Access</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 text-green-500" />
                            <span className="text-green-600">Allow Access</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">User Settings</span>
                      </DropdownMenuItem>
                      {/* Future actions can be added here */}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Confirmation Dialog */}
                  <Dialog
                    open={showConfirmDialog}
                    onOpenChange={setShowConfirmDialog}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {pendingUser && pendingUser.allowed
                            ? "Revoke Access"
                            : "Allow Access"}
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to{" "}
                          {pendingUser && pendingUser.allowed
                            ? "revoke"
                            : "allow"}{" "}
                          access for{" "}
                          <span className="font-semibold">
                            {pendingUser?.name}
                          </span>
                          ?
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPendingUser(null);
                            setShowConfirmDialog(false);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant={
                            pendingUser && pendingUser.allowed
                              ? "destructive"
                              : "default"
                          }
                          onClick={handleConfirmToggleAllowed}
                        >
                          Confirm
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && users.length === 0 && (
          <div className="text-center workspace-sidebar-text py-12">
            No users found.
          </div>
        )}
      </div>
      <div className="flex justify-center mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {/* Page numbers logic */}
            {Array.from({ length: Math.ceil(total / pageSize) }).map((_, i) => {
              // Show first, last, current, and neighbors; ellipsis for gaps
              const pageNum = i + 1;
              const isCurrent = pageNum === page;
              const show =
                pageNum === 1 ||
                pageNum === Math.ceil(total / pageSize) ||
                Math.abs(pageNum - page) <= 1;
              if (
                !show &&
                ((pageNum === 2 && page > 3) ||
                  (pageNum === Math.ceil(total / pageSize) - 1 &&
                    page < Math.ceil(total / pageSize) - 2))
              ) {
                return (
                  <PaginationItem key={pageNum + "ellipsis"}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              if (!show) return null;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    isActive={isCurrent}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(pageNum);
                    }}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < Math.ceil(total / pageSize)) setPage(page + 1);
                }}
                className={
                  page === Math.ceil(total / pageSize)
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </>
  );
}
