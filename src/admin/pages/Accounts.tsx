import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShieldCheck, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LevelBadge, LevelPips } from "@/components/shared/LevelPips";
import { ACCESS_LEVELS } from "@/lib/access";
import { formatDate } from "@/lib/utils";
import { ChangeLevelDialog, Initials, PageHeader } from "../components";
import { useAdminData } from "../useAdminData";
import type { AdminUser } from "../types";

type Show = "all" | "waiting" | "admins";

export default function Accounts() {
  const { data, error, reload } = useAdminData<{ users: AdminUser[] }>("/users");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [show, setShow] = useState<Show>("all");
  const [editing, setEditing] = useState<{ user: AdminUser; level: number } | null>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.users ?? []).filter((u) => {
      if (level !== "all" && u.accessLevel !== Number(level)) return false;
      if (show === "waiting" && !u.pendingRequest) return false;
      if (show === "admins" && u.role !== "admin") return false;
      return !q || [u.name, u.username, u.badge, u.department, u.email].some((v) => v.toLowerCase().includes(q));
    });
  }, [data, search, level, show]);

  return (
    <>
      <PageHeader title="Accounts" subtitle="Every registered account and its access level. Change a level from the dropdown." />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, badge, department…"
            aria-label="Search accounts"
            className="h-9 pl-8"
          />
        </div>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="h-9 w-36" aria-label="Filter by level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {ACCESS_LEVELS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                Level {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={show} onValueChange={(v) => setShow(v as Show)}>
          <SelectTrigger className="h-9 w-44" aria-label="Filter accounts">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All accounts</SelectItem>
            <SelectItem value="waiting">Request waiting</SelectItem>
            <SelectItem value="admins">Administrators</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        {error && <p role="alert" className="p-4 text-xs text-red">{error}</p>}
        {!data && !error && <p className="p-4 text-xs text-text-muted">Loading…</p>}
        {data && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Account</TableHead>
                <TableHead>Badge · Department</TableHead>
                <TableHead>Access level</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Request</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Link to={`/accounts/${u.id}`} className="flex items-center gap-2.5">
                      <Initials name={u.name} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-text hover:text-cyan-300">
                          {u.name}
                          {u.role === "admin" && <Badge variant="purple">Admin</Badge>}
                        </span>
                        <span className="block max-w-56 truncate text-[10px] text-text-muted">{u.username}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {[u.badge, u.department].filter(Boolean).join(" · ") || <span className="text-text-muted">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <LevelPips level={u.accessLevel} />
                      <Select value={String(u.accessLevel)} onValueChange={(v) => setEditing({ user: u, level: Number(v) })}>
                        <SelectTrigger className="mono h-7 w-20" aria-label={`Access level for ${u.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACCESS_LEVELS.map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              Level {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    {u.twoFactorEnabled ? (
                      <ShieldCheck size={15} className="text-green" aria-label="Two-factor on" />
                    ) : (
                      <ShieldOff size={15} className="text-text-muted" aria-label="Two-factor not set up" />
                    )}
                  </TableCell>
                  <TableCell>
                    {u.pendingRequest ? (
                      <Link to={`/requests/${u.pendingRequest.id}`} className="flex items-center gap-1 text-amber hover:opacity-80">
                        Wants <LevelBadge level={u.pendingRequest.requestedLevel} className="border-0 bg-transparent px-0" />
                      </Link>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-text-secondary">{formatDate(new Date(u.createdAt).toISOString())}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-10 text-center text-text-muted">
                    No accounts match.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
      {data && (
        <p className="mt-2 text-[11px] text-text-muted">
          Showing {rows.length} of {data.users.length} accounts
        </p>
      )}

      {editing && (
        <ChangeLevelDialog
          user={editing.user}
          level={editing.level}
          onClose={() => setEditing(null)}
          onChanged={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}
