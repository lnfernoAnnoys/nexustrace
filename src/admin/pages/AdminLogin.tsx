import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Copy, KeyRound, Lock, ShieldCheck, Smartphone, User, KeySquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackupCodes } from "@/components/auth/BackupCodes";
import type { AuthUser } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { useAdminAuth } from "../AdminAuthContext";

type Step =
  | { kind: "credentials" }
  | { kind: "verify" }
  | { kind: "enroll"; qr: string; secret: string }
  | { kind: "backup"; codes: string[]; user: AuthUser };

const groupSecret = (secret: string) => secret.replace(/(.{4})/g, "$1 ").trim();

export default function AdminLogin() {
  const { status, setAdmin } = useAdminAuth();
  const [step, setStep] = useState<Step>({ kind: "credentials" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [savedCodes, setSavedCodes] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "authenticated") return <Navigate to="/" replace />;

  function restart(message = "") {
    setStep({ kind: "credentials" });
    setPassword("");
    setCode("");
    setUseBackupCode(false);
    setError(message);
  }

  function handleError(err: unknown) {
    if (err instanceof ApiError && err.data?.restart) return restart(err.message);
    setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
  }

  async function submitCredentials(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { next } = await api<{ next: "verify" | "enroll" }>("/admin/auth/login", {
        method: "POST",
        body: { username, password },
      });
      if (next === "verify") {
        setStep({ kind: "verify" });
      } else {
        const setup = await api<{ qr: string; secret: string }>("/admin/auth/2fa/setup", { method: "POST" });
        setStep({ kind: "enroll", qr: setup.qr, secret: setup.secret });
      }
      setCode("");
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitVerify(value: string) {
    setError("");
    setBusy(true);
    try {
      const { user } = await api<{ user: AuthUser }>("/admin/auth/2fa/verify", { method: "POST", body: { code: value } });
      setAdmin(user);
    } catch (err) {
      setCode("");
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function submitEnroll(value: string) {
    setError("");
    setBusy(true);
    try {
      const res = await api<{ user: AuthUser; backupCodes: string[] }>("/admin/auth/2fa/enable", {
        method: "POST",
        body: { code: value },
      });
      setSavedCodes(false);
      setStep({ kind: "backup", codes: res.backupCodes, user: res.user });
    } catch (err) {
      setCode("");
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function back() {
    try {
      await api("/admin/auth/logout", { method: "POST" });
    } catch {
      // the pending session expires on its own
    }
    restart();
  }

  function onCodeChange(raw: string, submit: (value: string) => void) {
    if (useBackupCode) return setCode(raw.toUpperCase());
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    if (digits.length === 6 && !busy) submit(digits);
  }

  const codeInput = (submit: (value: string) => void) => (
    <Input
      autoFocus
      value={code}
      onChange={(e) => onCodeChange(e.target.value, submit)}
      inputMode={useBackupCode ? "text" : "numeric"}
      autoComplete="one-time-code"
      placeholder={useBackupCode ? "XXXXX-XXXXX" : "000000"}
      maxLength={useBackupCode ? 16 : 6}
      aria-label={useBackupCode ? "Backup code" : "6-digit authenticator code"}
      className="mono h-12 text-center text-xl tracking-[0.4em] placeholder:tracking-[0.4em]"
    />
  );

  const errorMessage = error && (
    <p role="alert" className="text-xs text-red">
      {error}
    </p>
  );

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-bg py-8">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/20 via-bg/70 to-bg" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <div className="glass rounded-xl border border-border-strong p-7 shadow-2xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 glow-cyan">
              <KeySquare size={24} className="text-cyan-400" />
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-text">NexusTrace Command</h1>
            <p className="text-xs text-text-muted">Access Control Console</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step.kind}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
            >
              {step.kind === "credentials" && (
                <form onSubmit={submitCredentials} className="flex flex-col gap-3">
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      autoFocus
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      className="pl-8"
                      placeholder="Administrator ID"
                      aria-label="Administrator ID"
                    />
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="pl-8"
                      placeholder="Password"
                      aria-label="Password"
                    />
                  </div>
                  {errorMessage}
                  <Button type="submit" disabled={busy || !username || !password} className="mt-1">
                    {busy ? "Verifying…" : "Continue"}
                    {!busy && <ArrowRight size={14} />}
                  </Button>
                </form>
              )}

              {step.kind === "verify" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (code) submitVerify(code);
                  }}
                  className="flex flex-col gap-3"
                >
                  <div className="text-center">
                    <ShieldCheck size={20} className="mx-auto mb-1.5 text-cyan-400" />
                    <p className="text-sm font-medium text-text">Two-factor authentication</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {useBackupCode
                        ? "Enter one of your saved backup codes."
                        : "Enter the 6-digit code from your authenticator app."}
                    </p>
                  </div>
                  {codeInput(submitVerify)}
                  {errorMessage}
                  <Button type="submit" disabled={busy || !code}>
                    {busy ? "Verifying…" : "Verify and sign in"}
                  </Button>
                  <div className="flex items-center justify-between text-xs">
                    <button type="button" onClick={back} className="flex items-center gap-1 text-text-muted hover:text-text">
                      <ArrowLeft size={12} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseBackupCode((v) => !v);
                        setCode("");
                        setError("");
                      }}
                      className="text-cyan-300 hover:text-cyan-200"
                    >
                      {useBackupCode ? "Use authenticator app" : "Use a backup code"}
                    </button>
                  </div>
                </form>
              )}

              {step.kind === "enroll" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (code.length === 6) submitEnroll(code);
                  }}
                  className="flex flex-col gap-3"
                >
                  <div className="text-center">
                    <Smartphone size={20} className="mx-auto mb-1.5 text-cyan-400" />
                    <p className="text-sm font-medium text-text">Set up two-factor authentication</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      Administrators must use an authenticator app. Scan this QR code with Google Authenticator, Microsoft
                      Authenticator or Authy.
                    </p>
                  </div>
                  <img
                    src={step.qr}
                    alt="QR code to add NexusTrace to your authenticator app"
                    className="mx-auto size-44 rounded-lg bg-white p-1.5"
                  />
                  <div className="rounded-md border border-border bg-panel-hover/40 p-2.5">
                    <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-text-muted">
                      <KeyRound size={10} /> Can't scan? Enter this key manually
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="mono break-all text-[11px] text-text">{groupSecret(step.secret)}</code>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(step.secret).catch(() => undefined)}
                        className="shrink-0 text-text-muted hover:text-cyan-300"
                        aria-label="Copy setup key"
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary">Then enter the 6-digit code it shows:</p>
                  {codeInput(submitEnroll)}
                  {errorMessage}
                  <Button type="submit" disabled={busy || code.length !== 6}>
                    {busy ? "Verifying…" : "Verify and continue"}
                  </Button>
                  <button
                    type="button"
                    onClick={back}
                    className="flex items-center justify-center gap-1 text-xs text-text-muted hover:text-text"
                  >
                    <ArrowLeft size={12} /> Back to sign in
                  </button>
                </form>
              )}

              {step.kind === "backup" && (
                <div className="flex flex-col gap-3">
                  <div className="text-center">
                    <ShieldCheck size={20} className="mx-auto mb-1.5 text-green" />
                    <p className="text-sm font-medium text-text">Two-factor is on. Save your backup codes</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      If you lose your phone, each code signs you in once. They won't be shown again.
                    </p>
                  </div>
                  <BackupCodes codes={step.codes} />
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
                    <input
                      type="checkbox"
                      checked={savedCodes}
                      onChange={(e) => setSavedCodes(e.target.checked)}
                      className="size-3.5 accent-violet-400"
                    />
                    I've saved these codes somewhere safe
                  </label>
                  <Button type="button" disabled={!savedCodes} onClick={() => setAdmin(step.user)}>
                    Open the console <ArrowRight size={14} />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-4 text-center text-[10px] text-text-muted">
          <span className="text-amber">Authorised administrators only.</span> Every change made here is recorded.
        </p>
      </motion.div>
    </div>
  );
}
