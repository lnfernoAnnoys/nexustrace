import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import { tr } from "@/i18n";
import { Button } from "@/components/ui/button";

export function BackupCodes({ codes }: { codes: string[] }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard can be blocked by the browser; the codes stay visible to copy by hand
    }
  }

  function download() {
    const text = `NexusTrace backup codes\nEach code can be used once.\n\n${codes.join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "nexustrace-backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border bg-panel-hover/40 p-3">
        {codes.map((c) => (
          <span key={c} className="mono text-center text-[13px] tracking-wider text-text">
            {c}
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={copy}>
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? tr("common.copied") : tr("common.copy")}
        </Button>
        <Button type="button" size="sm" variant="outline" className="flex-1" onClick={download}>
          <Download size={13} /> {tr("common.download")}
        </Button>
      </div>
    </div>
  );
}
