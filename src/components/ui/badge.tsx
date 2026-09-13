import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none w-fit whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-border bg-panel-hover text-text-secondary",
        cyan: "border-cyan/30 bg-cyan/10 text-cyan",
        green: "border-green/30 bg-green/10 text-green",
        amber: "border-amber/30 bg-amber/10 text-amber",
        orange: "border-orange/30 bg-orange/10 text-orange",
        red: "border-red/30 bg-red/10 text-red",
        blue: "border-blue/30 bg-blue/10 text-blue",
        purple: "border-purple/30 bg-purple/10 text-purple",
        outline: "border-border-strong text-text-secondary bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
