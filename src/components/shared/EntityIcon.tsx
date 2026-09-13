import { User, Phone, Car, Building2, MapPin, Landmark, type LucideIcon } from "lucide-react";
import type { EntityType } from "@/types";
import { ENTITY_TYPE_COLOR } from "@/data";
import { cn } from "@/lib/utils";

const ICONS: Record<EntityType, LucideIcon> = {
  person: User,
  phone: Phone,
  vehicle: Car,
  organization: Building2,
  location: MapPin,
  financial_account: Landmark,
};

export function EntityIcon({
  type,
  className,
  size = 16,
}: {
  type: EntityType;
  className?: string;
  size?: number;
}) {
  const Icon = ICONS[type];
  return <Icon size={size} className={className} style={{ color: ENTITY_TYPE_COLOR[type] }} />;
}

export function EntityIconBadge({ type, size = 34 }: { type: EntityType; size?: number }) {
  const Icon = ICONS[type];
  const color = ENTITY_TYPE_COLOR[type];
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-lg border")}
      style={{
        width: size,
        height: size,
        borderColor: `${color}40`,
        backgroundColor: `${color}14`,
      }}
    >
      <Icon size={size * 0.52} style={{ color }} />
    </div>
  );
}
