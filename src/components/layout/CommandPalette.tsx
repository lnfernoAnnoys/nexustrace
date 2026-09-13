import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { EntityIcon } from "@/components/shared/EntityIcon";
import { FolderLock } from "lucide-react";
import { allEntities, cases } from "@/data";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[18%] max-w-xl translate-y-0 p-0">
        <Command shouldFilter={true}>
          <CommandInput placeholder="Search people, phones, vehicles, cases…" value={query} onValueChange={setQuery} autoFocus />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Cases">
              {cases.map((c) => (
                <CommandItem key={c.id} value={`${c.id} ${c.title}`} onSelect={() => go(`/cases/${c.id}`)}>
                  <FolderLock size={14} className="text-cyan-400" />
                  <span className="flex-1">{c.title}</span>
                  <span className="mono text-[10px] text-text-muted">{c.id}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Entities">
              {allEntities.slice(0, 60).map((e) => (
                <CommandItem
                  key={e.id}
                  value={`${e.name} ${e.type}`}
                  onSelect={() => go(`/entities/${e.type}/${e.id}`)}
                >
                  <EntityIcon type={e.type} size={14} />
                  <span className="flex-1 truncate">{e.name}</span>
                  <span className="text-[10px] text-text-muted capitalize">{e.type.replace("_", " ")}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
