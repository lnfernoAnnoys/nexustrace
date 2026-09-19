import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ShieldHalf } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <ShieldHalf size={28} className="animate-pulse-slow text-cyan-400" />
      </div>
    );
  }
  if (status === "anonymous") return <Navigate to="/" replace />;
  return <>{children}</>;
}
