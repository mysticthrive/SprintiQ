"use client";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Calendar, Building2, User, Mails } from "lucide-react";

export interface ContactMessage {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
  created_at: string;
}

interface AdminEmailsTableProps {
  messages: ContactMessage[];
  error: string | null;
}

const PAGE_SIZE = 20;

export default function AdminEmailsTable({
  messages,
  error,
}: AdminEmailsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const pageSize = PAGE_SIZE;

  // Filtered messages
  const filtered = useMemo(() => {
    if (!search.trim()) return messages;
    const s = search.trim().toLowerCase();
    return messages.filter(
      (msg) =>
        msg.first_name.toLowerCase().includes(s) ||
        msg.last_name.toLowerCase().includes(s) ||
        msg.email.toLowerCase().includes(s) ||
        (msg.company && msg.company.toLowerCase().includes(s)) ||
        msg.subject.toLowerCase().includes(s)
    );
  }, [messages, search]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Reset page on search change
  useEffect(() => {
    setPage(1);
  }, [search]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contact Messages</h1>
        <p className="text-muted-foreground text-sm">
          Contact form messages from users
        </p>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
        <Input
          type="text"
          placeholder="Search name, email, subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:w-64"
        />
      </div>
      <div className="relative rounded-xl p-0 md:p-6 shadow-lg border workspace-border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="workspace-sidebar-text">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Message</th>
              <th className="px-4 py-3 text-left">Created At</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((msg) => (
              <tr
                key={msg.id}
                className="border-t workspace-border hover:workspace-hover cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3 min-w-[120px] workspace-sidebar-text group-hover:scale-105 duration-300">
                  {msg.first_name} {msg.last_name}
                </td>
                <td className="px-4 py-3 min-w-[160px] workspace-sidebar-text group-hover:scale-105 duration-300">
                  {msg.email}
                </td>
                <td className="px-4 py-3 min-w-[120px] workspace-sidebar-text group-hover:scale-105 duration-300">
                  {msg.company}
                </td>
                <td className="px-4 py-3 min-w-[120px] workspace-sidebar-text group-hover:scale-105 duration-300">
                  {msg.subject}
                </td>
                <td
                  className="px-4 py-3 max-w-xs truncate workspace-sidebar-text group-hover:scale-105 duration-300"
                  title={msg.message}
                >
                  {msg.message}
                </td>
                <td className="px-4 py-3 min-w-[140px] workspace-sidebar-text group-hover:scale-105 duration-300">
                  {new Date(msg.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <Dialog
                    open={selected?.id === msg.id}
                    onOpenChange={(open) => setSelected(open ? msg : null)}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg w-full">
                      <DialogHeader>
                        <DialogTitle className="text-base mb-1">
                          Contact Message
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {new Date(msg.created_at).toLocaleString()}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <User className="w-4 h-4 text-muted-foreground" />{" "}
                            Name
                          </div>
                          <div className="font-semibold text-xs">
                            {msg.first_name} {msg.last_name}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Building2 className="w-4 h-4 text-muted-foreground" />{" "}
                            Company
                          </div>
                          <div className="font-medium text-xs">
                            {msg.company}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="w-4 h-4 text-muted-foreground" />{" "}
                            Email
                          </div>
                          <div className=" font-medium text-xs">
                            <span>{msg.email}</span>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Mails className="w-4 h-4 text-muted-foreground" />{" "}
                            Subject
                          </div>
                          <div className="font-semibold text-xs mb-1">
                            {msg.subject}
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <div className="text-xs text-muted-foreground mb-1">
                            Message
                          </div>
                          <div className="rounded-md border bg-muted p-3 max-h-60 overflow-auto whitespace-pre-line break-words text-xs">
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No messages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-2">
          <span className="text-xs text-muted-foreground">
            Showing {paged.length} of {total} messages
          </span>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={page === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        if (page !== i + 1) setPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    aria-disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
        {error && <div className="text-red-500 text-center py-4">{error}</div>}
      </div>
    </>
  );
}
