import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader, describeAudit, when } from "../components";
import { useAdminData } from "../useAdminData";
import type { AuditEntry } from "../types";

export default function AuditLog() {
  const { data, error } = useAdminData<{ entries: AuditEntry[] }>("/audit?limit=200");

  return (
    <>
      <PageHeader title="Audit Log" subtitle="Every access change made in this console or from the command line, newest first" />
      <Card className="overflow-hidden">
        {error && <p role="alert" className="p-4 text-xs text-red">{error}</p>}
        {!data && !error && <p className="p-4 text-xs text-text-muted">Loading…</p>}
        {data && (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>When</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-text-secondary">{when(e.at)}</TableCell>
                  <TableCell className="whitespace-nowrap">{e.actorName}</TableCell>
                  <TableCell className="text-text-secondary">{describeAudit(e)}</TableCell>
                  <TableCell className="max-w-64 text-text-secondary">
                    {typeof e.detail.note === "string" && e.detail.note ? e.detail.note : <span className="text-text-muted">—</span>}
                  </TableCell>
                </TableRow>
              ))}
              {data.entries.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-10 text-center text-text-muted">
                    No changes have been made yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </>
  );
}
