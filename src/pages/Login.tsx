import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldHalf, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NetworkGraph } from "@/components/graph/NetworkGraph";
import { allEntities, relationships } from "@/data";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate("/dashboard"), 900);
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-bg">
      <div className="absolute inset-0 opacity-40">
        <NetworkGraph entities={allEntities} relationships={relationships} layout="force" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/80 to-bg" />
      <div className="absolute inset-0 bg-grid opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="glass rounded-xl border border-border-strong p-7 shadow-2xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 glow-cyan">
              <ShieldHalf size={24} className="text-cyan-400" />
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-text">NexusTrace</h1>
            <p className="text-xs text-text-muted">AI-Powered Criminal Network Analysis</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input defaultValue="a.sharma" className="pl-8" placeholder="Investigator ID" />
            </div>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input type="password" defaultValue="••••••••••" className="pl-8" placeholder="Password" />
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Authenticating…" : "Sign In"}
              {!loading && <ArrowRight size={14} />}
            </Button>
          </form>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] text-text-muted">
          <span className="mono">Government of India</span>
          <span>·</span>
          <span>Ministry of Home Affairs</span>
          <span>·</span>
          <span className="text-amber">Restricted Access</span>
        </div>
      </motion.div>
    </div>
  );
}
