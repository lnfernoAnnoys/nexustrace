import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { ShieldHalf } from "lucide-react";
import { tr } from "@/i18n";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ensureDataset } from "@/data/loader";

function Splash({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-bg">
      <ShieldHalf size={28} className="animate-pulse-slow text-cyan-400" />
      {children}
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  // the case data is only requested once the person is signed in
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    ensureDataset()
      .then(() => !cancelled && setDataState("ready"))
      .catch(() => !cancelled && setDataState("error"));
    return () => {
      cancelled = true;
    };
  }, [status, attempt]);

  if (status === "loading") return <Splash />;
  if (status === "anonymous") return <Navigate to="/" replace />;
  if (dataState === "error") {
    return (
      <Splash>
        <p className="text-xs text-text-secondary">{tr("auth.dataFailed")}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setDataState("loading");
            setAttempt((n) => n + 1);
          }}
        >
          {tr("auth.tryAgain")}
        </Button>
      </Splash>
    );
  }
  if (dataState === "loading") return <Splash><p className="text-xs text-text-muted">{tr("auth.loadingData")}</p></Splash>;
  return <>{children}</>;
}
