import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Clock,
  Copy,
  FileText,
  KeyRound,
  Lock,
  Mail,
  Paperclip,
  ShieldCheck,
  ShieldHalf,
  Smartphone,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackupCodes } from "@/components/auth/BackupCodes";
import { NetworkGraph } from "@/components/graph/NetworkGraph";
import { decorativeGraph } from "@/lib/decorativeGraph";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import { api, ApiError } from "@/lib/api";
import { LanguageSelect } from "@/components/settings/LanguagePicker";
import { MAX_UPLOAD_FILES, MAX_UPLOAD_MB, formatBytes } from "@/lib/access";
import { tr } from "@/i18n";

type Step =
  | { kind: "credentials" }
  | { kind: "signup1" }
  | { kind: "signup2" }
  | { kind: "signup_pending" }
  | { kind: "verify" }
  | { kind: "enroll"; qr: string; secret: string }
  | { kind: "backup"; codes: string[]; user: AuthUser };

function groupSecret(secret: string) {
  return secret.replace(/(.{4})/g, "$1 ").trim();
}

const backdrop = decorativeGraph();

export default function Login() {
  const { status, setUser } = useAuth();
  const [step, setStep] = useState<Step>({ kind: "credentials" });
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirm, setConfirm] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [idFiles, setIdFiles] = useState<File[]>([]);
  const [fileNotice, setFileNotice] = useState("");
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [savedCodes, setSavedCodes] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const filePicker = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<{ signupOpen: boolean }>("/auth/config")
      .then((c) => setSignupOpen(c.signupOpen))
      .catch(() => setSignupOpen(false));
  }, []);

  if (status === "authenticated") return <Navigate to="/dashboard" replace />;

  function restart(message = "") {
    setStep({ kind: "credentials" });
    setPassword("");
    setConfirm("");
    setCode("");
    setUseBackupCode(false);
    setDepartment("");
    setPosition("");
    setIdFiles([]);
    setFileNotice("");
    setError(message);
  }

  function addFiles(incoming: File[]) {
    const next = [...idFiles];
    let problem = "";
    for (const f of incoming) {
      if (next.length >= MAX_UPLOAD_FILES) {
        problem = tr("acc.errMax", { n: MAX_UPLOAD_FILES });
        break;
      }
      if (!/\.(pdf|png|jpe?g)$/i.test(f.name)) {
        problem = tr("acc.errType", { name: f.name });
        continue;
      }
      if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
        problem = tr("acc.errSize", { name: f.name, mb: MAX_UPLOAD_MB });
        continue;
      }
      next.push(f);
    }
    setIdFiles(next);
    setFileNotice(problem);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles([...e.dataTransfer.files]);
  }

  function handleError(err: unknown) {
    if (err instanceof ApiError && err.data?.restart) {
      restart(err.message);
      return;
    }
    setError(err instanceof ApiError ? err.message : tr("login.generic"));
  }

  /** After the password step (sign in or sign up) the server says which 2FA step comes next. */
  async function beginSecondStep(next: "verify" | "enroll") {
    if (next === "verify") {
      setStep({ kind: "verify" });
    } else {
      const setup = await api<{ qr: string; secret: string }>("/auth/2fa/setup", { method: "POST" });
      setStep({ kind: "enroll", qr: setup.qr, secret: setup.secret });
    }
    setCode("");
  }

  async function submitCredentials(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { next } = await api<{ next: "verify" | "enroll" }>("/auth/login", {
        method: "POST",
        body: { username, password },
      });
      await beginSecondStep(next);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  function submitSignup1(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError(tr("login.mismatch"));
      return;
    }
    setError("");
    setStep({ kind: "signup2" });
  }

  async function submitSignup2(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const form = new FormData();
      form.append("username", username);
      form.append("name", fullName);
      form.append("email", email);
      form.append("password", password);
      form.append("department", department);
      form.append("position", position);
      for (const f of idFiles) form.append("files", f);
      await api("/auth/signup", { method: "POST", body: form });
      setStep({ kind: "signup_pending" });
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  function switchTo(kind: "credentials" | "signup1") {
    setStep({ kind });
    setPassword("");
    setConfirm("");
    setDepartment("");
    setPosition("");
    setIdFiles([]);
    setFileNotice("");
    setError("");
  }

  async function submitVerify(value: string) {
    setError("");
    setBusy(true);
    try {
      const { user } = await api<{ user: AuthUser }>("/auth/2fa/verify", { method: "POST", body: { code: value } });
      setUser(user);
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
      const res = await api<{ user: AuthUser; backupCodes: string[] }>("/auth/2fa/enable", {
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
      await api("/auth/logout", { method: "POST" });
    } catch {
      // the pending session expires on its own
    }
    restart();
  }

  function onCodeChange(raw: string, submit: (value: string) => void) {
    if (useBackupCode) {
      setCode(raw.toUpperCase());
      return;
    }
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
      aria-label={useBackupCode ? tr("login.backupAria") : tr("login.codeAria")}
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
      <div className="absolute inset-0 opacity-40">
        <NetworkGraph entities={backdrop.entities} relationships={backdrop.relationships} layout="force" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-bg/60 via-bg/80 to-bg" />
      <div className="absolute inset-0 bg-grid opacity-60" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <div className="glass rounded-xl border border-border-strong p-7 shadow-2xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 glow-cyan">
              <ShieldHalf size={24} className="text-cyan-400" />
            </div>
            <h1 className="text-lg font-semibold tracking-wide text-text">NexusTrace</h1>
            <p className="text-xs text-text-muted">{tr("login.tagline")}</p>
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
                      placeholder={tr("login.id")}
                      aria-label={tr("login.id")}
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
                      placeholder={tr("login.password")}
                      aria-label={tr("login.password")}
                    />
                  </div>
                  {errorMessage}
                  <Button type="submit" disabled={busy || !username || !password} className="mt-1">
                    {busy ? tr("login.verifying") : tr("common.continue")}
                    {!busy && <ArrowRight size={14} />}
                  </Button>
                  {signupOpen && (
                    <p className="text-center text-xs text-text-muted">
                      {tr("login.newHere")}{" "}
                      <button type="button" onClick={() => switchTo("signup1")} className="text-cyan-300 hover:text-cyan-200">
                        {tr("login.createLink")}
                      </button>
                    </p>
                  )}
                </form>
              )}

              {step.kind === "signup1" && (
                <form onSubmit={submitSignup1} className="flex flex-col gap-3">
                  <div className="text-center">
                    <UserPlus size={20} className="mx-auto mb-1.5 text-cyan-400" />
                    <p className="text-sm font-medium text-text">{tr("login.createTitle")}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{tr("login.stepOf", { n: 1 })} · {tr("login.createSub")}</p>
                  </div>
                  <Input
                    autoFocus
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="name"
                    placeholder={tr("login.fullName")}
                    aria-label={tr("login.fullName")}
                  />
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="pl-8"
                      placeholder={tr("login.email")}
                      aria-label={tr("login.email")}
                    />
                  </div>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      className="pl-8"
                      placeholder={tr("login.idOrEmail")}
                      aria-label={tr("login.id")}
                    />
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="pl-8"
                      placeholder={tr("login.passwordHint")}
                      aria-label={tr("login.password")}
                    />
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      className="pl-8"
                      placeholder={tr("login.confirm")}
                      aria-label={tr("login.confirm")}
                    />
                  </div>
                  {errorMessage}
                  <Button type="submit" disabled={!fullName || !email || !username || !password || !confirm}>
                    {tr("login.next")} <ArrowRight size={14} />
                  </Button>
                  <p className="text-center text-xs text-text-muted">
                    {tr("login.haveAccount")}{" "}
                    <button type="button" onClick={() => switchTo("credentials")} className="text-cyan-300 hover:text-cyan-200">
                      {tr("login.signIn")}
                    </button>
                  </p>
                </form>
              )}

              {step.kind === "signup2" && (
                <form onSubmit={submitSignup2} className="flex flex-col gap-3">
                  <div className="text-center">
                    <Briefcase size={20} className="mx-auto mb-1.5 text-cyan-400" />
                    <p className="text-sm font-medium text-text">{tr("login.step2Title")}</p>
                    <p className="mt-0.5 text-xs text-text-muted">{tr("login.stepOf", { n: 2 })} · {tr("login.step2Sub")}</p>
                  </div>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      autoFocus
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="pl-8"
                      placeholder={tr("login.department")}
                      aria-label={tr("login.department")}
                    />
                  </div>
                  <div className="relative">
                    <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <Input
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="pl-8"
                      placeholder={tr("login.position")}
                      aria-label={tr("login.position")}
                    />
                  </div>

                  <div>
                    <p className="mb-1.5 text-[11px] text-text-muted">{tr("login.idProofTitle")}</p>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={onDrop}
                      onClick={() => filePicker.current?.click()}
                      className={`flex cursor-pointer flex-col items-center gap-1 rounded-md border border-dashed px-3 py-4 text-center transition-colors ${
                        dragging ? "border-cyan-400 bg-cyan-500/10" : "border-border-strong hover:border-border-strong/70"
                      }`}
                    >
                      <Paperclip size={15} className="text-text-muted" />
                      <p className="text-[11px] text-text-secondary">
                        {tr("login.idProofDrop")} <span className="text-cyan-300">{tr("acc.browse")}</span>
                      </p>
                      <p className="text-[10px] text-text-muted">{tr("acc.fileRules", { n: MAX_UPLOAD_FILES, mb: MAX_UPLOAD_MB })}</p>
                      <input
                        ref={filePicker}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                        multiple
                        hidden
                        onChange={(e) => { addFiles([...(e.target.files ?? [])]); e.target.value = ""; }}
                      />
                    </div>
                    {idFiles.length > 0 && (
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {idFiles.map((f, i) => (
                          <li key={`${f.name}-${i}`} className="flex items-center gap-1.5 rounded-md border border-border bg-panel-hover/30 px-2 py-1">
                            <FileText size={12} className="shrink-0 text-text-muted" />
                            <span className="min-w-0 flex-1 truncate text-[11px] text-text">{f.name}</span>
                            <span className="text-[10px] text-text-muted">{formatBytes(f.size)}</span>
                            <button
                              type="button"
                              onClick={() => setIdFiles((cur) => cur.filter((_, j) => j !== i))}
                              aria-label={tr("acc.remove", { name: f.name })}
                              className="text-text-muted hover:text-red"
                            >
                              <X size={12} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {fileNotice && <p role="alert" className="mt-1 text-[11px] text-amber">{fileNotice}</p>}
                  </div>

                  {errorMessage}
                  <Button type="submit" disabled={busy}>
                    {busy ? tr("login.creating") : tr("login.createBtn")}
                    {!busy && <ArrowRight size={14} />}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep({ kind: "signup1" })}
                    className="flex items-center justify-center gap-1 text-xs text-text-muted hover:text-text"
                  >
                    <ArrowLeft size={12} /> {tr("common.back")}
                  </button>
                </form>
              )}

              {step.kind === "signup_pending" && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <Clock size={22} className="text-amber" />
                  <p className="text-sm font-medium text-text">{tr("login.pendingTitle")}</p>
                  <p className="text-xs text-text-secondary">{tr("login.pendingBody")}</p>
                  <Button type="button" onClick={() => switchTo("credentials")} className="mt-1">
                    {tr("login.backToSignIn")}
                  </Button>
                </div>
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
                    <p className="text-sm font-medium text-text">{tr("login.twofa")}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {useBackupCode
                        ? tr("login.enterBackup")
                        : tr("login.enterCode")}
                    </p>
                  </div>
                  {codeInput(submitVerify)}
                  {errorMessage}
                  <Button type="submit" disabled={busy || !code}>
                    {busy ? tr("login.verifying") : tr("login.verifySignIn")}
                  </Button>
                  <div className="flex items-center justify-between text-xs">
                    <button type="button" onClick={back} className="flex items-center gap-1 text-text-muted hover:text-text">
                      <ArrowLeft size={12} /> {tr("common.back")}
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
                      {useBackupCode ? tr("login.useApp") : tr("login.useBackup")}
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
                    <p className="text-sm font-medium text-text">{tr("login.setup")}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {tr("login.scan")}
                    </p>
                  </div>
                  <img
                    src={step.qr}
                    alt={tr("login.qrAlt")}
                    className="mx-auto size-44 rounded-lg bg-white p-1.5"
                  />
                  <div className="rounded-md border border-border bg-panel-hover/40 p-2.5">
                    <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-text-muted">
                      <KeyRound size={10} /> {tr("login.cantScan")}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="mono break-all text-[11px] text-text">{groupSecret(step.secret)}</code>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(step.secret).catch(() => undefined)}
                        className="shrink-0 text-text-muted hover:text-cyan-300"
                        aria-label={tr("login.copyKey")}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary">{tr("login.thenEnter")}</p>
                  {codeInput(submitEnroll)}
                  {errorMessage}
                  <Button type="submit" disabled={busy || code.length !== 6}>
                    {busy ? tr("login.verifying") : tr("login.verifyContinue")}
                  </Button>
                  <button
                    type="button"
                    onClick={back}
                    className="flex items-center justify-center gap-1 text-xs text-text-muted hover:text-text"
                  >
                    <ArrowLeft size={12} /> {tr("login.backToSignIn")}
                  </button>
                </form>
              )}

              {step.kind === "backup" && (
                <div className="flex flex-col gap-3">
                  <div className="text-center">
                    <ShieldCheck size={20} className="mx-auto mb-1.5 text-green" />
                    <p className="text-sm font-medium text-text">{tr("login.savedTitle")}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {tr("login.savedSub")}
                    </p>
                  </div>
                  <BackupCodes codes={step.codes} />
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-text-secondary">
                    <input
                      type="checkbox"
                      checked={savedCodes}
                      onChange={(e) => setSavedCodes(e.target.checked)}
                      className="size-3.5 accent-cyan-400"
                    />
                    {tr("login.savedCheck")}
                  </label>
                  <Button type="button" disabled={!savedCodes} onClick={() => setUser(step.user)}>
                    {tr("login.continueTo")} <ArrowRight size={14} />
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-center text-[10px] text-text-muted">
          <span className="mono">{tr("login.gov")}</span>
          <span>·</span>
          <span>{tr("login.mha")}</span>
          <span>·</span>
          <span className="text-amber">{tr("login.restricted")}</span>
        </div>
        <div className="mt-3 flex justify-center">
          <LanguageSelect />
        </div>
      </motion.div>
    </div>
  );
}
