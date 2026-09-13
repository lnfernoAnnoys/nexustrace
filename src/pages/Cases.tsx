import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cases as initialCases } from "@/data";
import { formatDate } from "@/lib/utils";
import type { CaseRecord } from "@/types";

export default function Cases() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseRecord[]>(initialCases);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchesQuery = `${c.title} ${c.id} ${c.category}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [cases, query, statusFilter]);

  function createCase() {
    const id = `case-2026-0${Math.floor(Math.random() * 900 + 100)}`;
    const record: CaseRecord = {
      id,
      title: newTitle || "Untitled Investigation",
      category: "General Investigation",
      status: "active",
      priority: "medium",
      description: newDesc,
      entityIds: [],
      assignedInvestigators: [{ name: "Insp. A. Sharma", badge: "IPS-4471", initials: "AS" }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCases((prev) => [record, ...prev]);
    setDialogOpen(false);
    setNewTitle("");
    setNewDesc("");
    navigate(`/cases/${id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">Cases</h1>
          <p className="text-xs text-text-secondary">{cases.length} investigations on file</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus size={14} /> New Case</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cases…" className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.map((c) => (
          <Card
            key={c.id}
            className="cursor-pointer transition-colors hover:border-border-strong"
            onClick={() => navigate(`/cases/${c.id}`)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mono text-[11px] text-text-muted">{c.id}</span>
                  <Badge variant={c.status === "active" ? "cyan" : c.status === "under_review" ? "amber" : "green"}>
                    {c.status.replace("_", " ")}
                  </Badge>
                  <Badge variant={c.priority === "critical" ? "red" : c.priority === "high" ? "orange" : "outline"}>
                    {c.priority} priority
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-text">{c.title}</p>
                <p className="text-xs text-text-secondary">{c.category}</p>
                <div className="mt-2 flex items-center gap-4 text-[11px] text-text-muted">
                  <span>{c.entityIds.length} entities</span>
                  <span>Created {formatDate(c.createdAt)}</span>
                  <span>Updated {formatDate(c.updatedAt)}</span>
                  <span>{c.assignedInvestigators.map((i) => i.name).join(", ")}</span>
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-text-muted" />
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-text-muted">No cases match your filters.</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Case</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div>
              <Label className="mb-1.5 block">Title</Label>
              <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Operation Redwood — Vehicle Theft Ring" />
            </div>
            <div>
              <Label className="mb-1.5 block">Description</Label>
              <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Brief case summary…" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={createCase}>Create Case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
