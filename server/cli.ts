import { MAX_ACCESS_LEVEL, MIN_ACCESS_LEVEL } from "./config.ts";
import { logAudit } from "./audit.ts";
import { db } from "./db.ts";
import {
  createUser,
  getUserById,
  getUserByUsername,
  hashPassword,
  listUsers,
  resetTwoFactor,
  setAccessLevel,
  setPasswordHash,
  setRole,
} from "./users.ts";

const USAGE = `Usage: npm run user -- <command>

  list                                   Show all users with their access level and role
  create <username> <password> [--name "Full Name"] [--badge ID] [--department "Unit"] [--position "Rank"] [--email a@b.gov.in] [--admin] [--level 1-8]
  make-admin <username>                  Let them sign in to the admin console (access levels and requests)
  remove-admin <username>                Take that away
  set-level <username> <1-8>             Change someone's access level
  reset-password <username> <password>   Set a new password and sign the user out everywhere
  reset-2fa <username>                   Remove their authenticator (they re-enroll at next sign-in)
  delete <username>                      Remove the user and their sessions
`;

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseLevel(raw: string): number {
  const level = Number(raw);
  if (!Number.isInteger(level) || level < MIN_ACCESS_LEVEL || level > MAX_ACCESS_LEVEL) {
    fail(`Access level must be a whole number from ${MIN_ACCESS_LEVEL} to ${MAX_ACCESS_LEVEL}.`);
  }
  return level;
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "list": {
    for (const u of listUsers()) {
      const status = u.status === "active" ? "       " : u.status === "banned" ? "BANNED " : "PENDING";
      console.log(
        `${u.username.padEnd(28)} ${u.name.padEnd(22)} level ${u.access_level}  ${u.role === "admin" ? "ADMIN  " : "       "}${status}  2FA: ${u.totp_enabled ? "on" : "not set up"}`,
      );
    }
    break;
  }
  case "create": {
    const [username, password] = args;
    if (!username || !password) fail(USAGE);
    if (password.length < 10) fail("Password must be at least 10 characters.");
    if (getUserByUsername(username)) fail(`User "${username}" already exists.`);
    const level = parseLevel(flag(args, "level") ?? "1");
    const user = await createUser({
      username,
      password,
      name: flag(args, "name") ?? username,
      badge: flag(args, "badge"),
      department: flag(args, "department"),
      position: flag(args, "position"),
      email: flag(args, "email"),
      status: "active", // made from the CLI/trusted side, so it skips the sign-up approval queue
    });
    if (level !== 1) setAccessLevel(user.id, level);
    if (args.includes("--admin")) setRole(user.id, "admin");
    console.log(
      `Created ${args.includes("--admin") ? "administrator" : "user"} "${username}" (level ${level}). They will set up an authenticator on first sign-in.`,
    );
    break;
  }
  case "make-admin":
  case "remove-admin": {
    const [username] = args;
    if (!username) fail(USAGE);
    const user = getUserByUsername(username) ?? fail(`No user "${username}".`);
    const role = command === "make-admin" ? "admin" : "user";
    if (user.role === role) fail(`"${username}" is ${role === "admin" ? "already an administrator" : "not an administrator"}.`);
    setRole(user.id, role);
    logAudit(null, "role_changed", user, { from: user.role, to: role });
    console.log(
      role === "admin"
        ? `"${username}" can now sign in to the admin console (/admin/).`
        : `"${username}" is no longer an administrator; their admin sessions were ended.`,
    );
    if (role === "user" && listUsers().every((u) => u.role !== "admin")) {
      console.warn("Warning: there are no administrators left. Create one with: npm run user -- make-admin <username>");
    }
    break;
  }
  case "set-level": {
    const [username, rawLevel] = args;
    if (!username || !rawLevel) fail(USAGE);
    const user = getUserByUsername(username) ?? fail(`No user "${username}".`);
    const level = parseLevel(rawLevel);
    if (level === user.access_level) fail(`"${username}" is already at level ${level}.`);
    setAccessLevel(user.id, level);
    logAudit(null, "level_changed", getUserById(user.id)!, { from: user.access_level, to: level, note: "" });
    console.log(`"${username}" is now at level ${level} (was ${user.access_level}).`);
    break;
  }
  case "reset-password": {
    const [username, password] = args;
    if (!username || !password) fail(USAGE);
    if (password.length < 10) fail("Password must be at least 10 characters.");
    const user = getUserByUsername(username) ?? fail(`No user "${username}".`);
    setPasswordHash(user.id, await hashPassword(password));
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
    console.log(`Password updated for "${username}"; all their sessions were ended.`);
    break;
  }
  case "reset-2fa": {
    const [username] = args;
    if (!username) fail(USAGE);
    const user = getUserByUsername(username) ?? fail(`No user "${username}".`);
    resetTwoFactor(user.id);
    console.log(`Two-factor removed for "${username}". They will set up a new authenticator on next sign-in.`);
    break;
  }
  case "delete": {
    const [username] = args;
    if (!username) fail(USAGE);
    const user = getUserByUsername(username) ?? fail(`No user "${username}".`);
    db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
    console.log(`Deleted user "${username}".`);
    break;
  }
  default:
    console.log(USAGE);
}
