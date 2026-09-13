import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "cyan",
  suffix,
  trend,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: "cyan" | "red" | "amber" | "green";
  suffix?: string;
  trend?: string;
}) {
  const animated = useCountUp(value);
  const accentClass = {
    cyan: "text-cyan border-cyan/25 bg-cyan/10",
    red: "text-red border-red/25 bg-red/10",
    amber: "text-amber border-amber/25 bg-amber/10",
    green: "text-green border-green/25 bg-green/10",
  }[accent];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="relative overflow-hidden p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-text-muted">{label}</p>
            <p className="mt-1.5 mono text-2xl font-semibold text-text">
              {animated.toLocaleString("en-IN")}
              {suffix}
            </p>
            {trend && <p className="mt-1 text-[11px] text-text-secondary">{trend}</p>}
          </div>
          <div className={cn("flex size-9 items-center justify-center rounded-lg border", accentClass)}>
            <Icon size={17} />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
