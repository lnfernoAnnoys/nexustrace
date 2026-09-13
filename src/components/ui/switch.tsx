import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border-strong bg-panel-hover transition-colors data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-400 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-3.5 translate-x-1 rounded-full bg-text shadow-lg transition-transform data-[state=checked]:translate-x-4 data-[state=checked]:bg-slate-950" />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
