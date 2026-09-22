import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, ChevronRight, FileSpreadsheet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportCasesPanel } from "@/components/cases/ImportCasesPanel";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cases as allCases } from "@/data";
import { bumpData, useDataVersion } from "@/data/store";
import { useAuth } from "@/context/AuthContext";
import type { CaseRecord } from "@/types";
import { cn } from "@/lib/utils";
import { tr, trn } from "@/i18n";

export default function Cases() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const version = useDataVersion();
  // the list follows the shared data, newest matter first
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cases = useMemo(() => [...allCases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [version]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<"single" | "file">("single");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  function openDialog(tab: "single" | "file") {
    setDialogTab(tab);
    setDialogOpen(true);
  }

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchesQuery = `${c.title} ${c.id} ${c.category}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [cases, query, statusFilter]);

  function createCase() {
    const id = `case-${new Date().getFullYear()}-${Date.now().toString(36)}`;
    const record: CaseRecord = {
      id,
      title: newTitle || "Untitled Investigation",
      category: "General Investigation",
      status: "active",
      priority: "medium",
      description: newDesc,
      entityIds: [],
      year: new Date().getFullYear(),
      assignedInvestigators: user ? [{ name: user.name, badge: user.badge || "YOU", initials: user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() }] : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allCases.unshift(record);
    bumpData();
    setDialogOpen(false);
    setNewTitle("");
    setNewDesc("");
    navigate(`/cases/${id}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-text">{tr("nav.cases")}</h1>
          <p className="text-xs text-text-secondary">{trn("cases.count", cases.length)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => openDialog("file")}><FileSpreadsheet size={14} /> {tr("cases.import")}</Button>
          <Button onClick={() => openDialog("single")}><Plus size={14} /> {tr("cases.new")}</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tr("cases.search")} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tr("cases.allStatuses")}</SelectItem>
            <SelectItem value="active">{tr("status.active")}</SelectItem>
            <SelectItem value="under_review">{tr("status.under_review")}</SelectItem>
            <SelectItem value="closed">{tr("status.closed")}</SelectItem>
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
                    {tr(`status.${c.status}`)}
                  </Badge>
                  <Badge variant={c.priority === "critical" ? "red" : c.priority === "high" ? "orange" : "outline"}>
                    {tr("prio.suffix", { p: tr(`prio.${c.priority}`) })}
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm font-semibold text-text">{c.title}</p>
                <p className="text-xs text-text-secondary">{c.category}</p>
                {c.impact && <p className="mt-1.5 max-w-3xl text-[11px] leading-snug text-text-secondary">{c.impact}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-muted">
                  {c.year && <span>{c.year}</span>}
                  {c.place && <span>{c.place}</span>}
                  <span>{trn("cases.entities", c.entityIds.length)}</span>
                  {c.assignedInvestigators.length > 0 && <span>{tr("cases.lead", { agencies: c.assignedInvestigators.map((i) => i.badge).join(", ") })}</span>}
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-text-muted" />
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-text-muted">{tr("cases.noMatch")}</p>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={cn(dialogTab === "file" && "max-w-4xl")}>
          <DialogHeader>
            <DialogTitle>{tr("cases.new")}</DialogTitle>
            <DialogDescription className="sr-only">{tr("cases.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as "single" | "file")}>
            <TabsList className="self-start">
              <TabsTrigger value="single">{tr("cases.tab.single")}</TabsTrigger>
              <TabsTrigger value="file"><FileSpreadsheet size={13} className="mr-1.5" /> {tr("cases.import")}</TabsTrigger>
            </TabsList>
            <TabsContent value="single">
              <div className="flex flex-col gap-3">
                <div>
                  <Label className="mb-1.5 block">{tr("common.title")}</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={tr("cases.titlePh")} />
                </div>
                <div>
                  <Label className="mb-1.5 block">{tr("common.description")}</Label>
                  <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder={tr("cases.descPh")} rows={4} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>{tr("common.cancel")}</Button>
                <Button onClick={createCase}>{tr("cases.create")}</Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="file">
              {dialogOpen && <ImportCasesPanel onClose={() => setDialogOpen(false)} onCreated={() => { setQuery(""); setStatusFilter("all"); }} />}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
