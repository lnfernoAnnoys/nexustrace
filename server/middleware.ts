import type { NextFunction, Request, RequestHandler, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { ALLOWED_ORIGINS, SESSION_COOKIES, type Realm } from "./config.ts";
import { findSessionByToken, touchSession, type SessionRow, type Stage } from "./sessions.ts";
import { getUserById, type UserRow } from "./users.ts";

export interface AuthContext {
  session: SessionRow;
  user: UserRow;
}

/** The authenticated context set by `loadSession` / checked by `requireStage`. */
export function getAuth(res: Response): AuthContext {
  return res.locals.auth as AuthContext;
}

export function maybeAuth(res: Response): AuthContext | undefined {
  return res.locals.auth as AuthContext | undefined;
}

export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
};

function sameHost(origin: string, host: string): boolean {
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Cookies are SameSite=Lax and the API only accepts JSON, which already blocks
 * classic CSRF. This adds a second layer: reject state-changing requests from a
 * browser page on a different site. A page is trusted when it was served from the
 * same host (and port) the request is sent to, so it works on any dev port or
 * hostname; CLIENT_ORIGIN can list extra origins for cross-origin setups.
 */
export const originGuard: RequestHandler = (req, res, next) => {
  const safe = req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS";
  const origin = req.headers.origin;
  if (!safe && origin && !ALLOWED_ORIGINS.has(origin) && !sameHost(origin, req.host)) {
    res.status(403).json({ error: "Forbidden origin" });
    return;
  }
  next();
};

/** Reads this realm's session cookie. A cookie from the other realm is ignored. */
export function loadSession(realm: Realm): RequestHandler {
  return (req, res, next) => {
    const token = req.cookies?.[SESSION_COOKIES[realm]];
    if (typeof token === "string" && token) {
      const session = findSessionByToken(token, realm);
      const user = session ? getUserById(session.user_id) : undefined;
      if (session && user) {
        touchSession(session);
        res.locals.auth = { session, user } satisfies AuthContext;
      }
    }
    next();
  };
}

export function requireStage(...stages: Stage[]): RequestHandler {
  return (_req: Request, res: Response, next: NextFunction) => {
    const auth = maybeAuth(res);
    if (!auth || !stages.includes(auth.session.stage)) {
      const pending = stages.some((s) => s !== "full");
      res.status(401).json({
        error: pending ? "Your sign-in session expired. Please sign in again." : "Not signed in",
        restart: pending,
      });
      return;
    }
    // Checked on every request, so removing someone's admin role locks them out immediately.
    if (auth.session.realm === "admin" && auth.session.stage === "full" && auth.user.role !== "admin") {
      res.status(403).json({ error: "This account is not an administrator." });
      return;
    }
    next();
  };
}

const limiterOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
} as const;

export const loginLimiter = rateLimit({
  ...limiterOptions,
  limit: 30,
  message: { error: "Too many sign-in attempts. Please wait a few minutes and try again." },
});

export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  limit: 20,
  message: { error: "Too many accounts created from this address. Please try again later." },
});

// Counted per signed-in account (colleagues often share one office IP), and only for requests that
// were accepted, so fixing a typo and resubmitting never uses up the allowance.
export const accessRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  limit: 10,
  skipFailedRequests: true,
  keyGenerator: (_req, res) => `user-${getAuth(res).user.id}`,
  message: { error: "Too many access requests. Please try again later." },
});

export const codeLimiter = rateLimit({
  ...limiterOptions,
  limit: 40,
  message: { error: "Too many code attempts. Please wait a few minutes and try again." },
});
