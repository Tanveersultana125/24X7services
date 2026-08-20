import { execFileSync } from "node:child_process";
import { connect } from "node:net";
import { sep } from "node:path";

/**
 * Clear the dev port before `next dev` binds it.
 *
 * `next dev` treats a busy port as a hint, not an error: it walks upwards until
 * something is free and prints the port it settled on once, in a line that
 * scrolls away. The browser meanwhile stays on the old URL, which is now either
 * a different project or a dead server — and every route answers 404 with
 * nothing to say why. Losing the tail of a stale dev server behind a fresh one
 * costs an afternoon of reading a working app's source for a bug it never had.
 *
 * So the port is fixed. What holds it, though, is almost always this project's
 * own dev server from a run that never exited — a terminal closed on it, a
 * reload that orphaned the child. Making a developer look that pid up and kill
 * it by hand is a chore with one correct answer every time, so we do it here:
 * a squatter whose command line names this directory is ours to reclaim, and
 * only an unrecognised program stops the run with the reason spelled out.
 */

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("check-dev-port: pass the port to check, e.g. `node scripts/check-dev-port.mjs 3200`.");
  process.exit(1);
}

/** No answer within this long counts as nothing listening. */
const TIMEOUT_MS = 1500;
/** How long a killed server gets to let go of the port before we give up on it. */
const RELEASE_MS = 5000;

const windows = process.platform === "win32";

/**
 * Is something serving the port?
 *
 * Dials it rather than trying to bind it: Windows honours SO_REUSEADDR on
 * listening sockets, so a second bind to a port that is already being served
 * succeeds and a bind probe reports every port as free. A connection does not.
 *
 * 127.0.0.1, because that is the address the browser resolves localhost to and
 * therefore the one a collision would actually be felt on.
 */
function occupied() {
  return new Promise((resolve) => {
    const socket = connect({ port, host: "127.0.0.1" });
    socket.setTimeout(TIMEOUT_MS);
    const settle = (answer) => {
      socket.destroy();
      resolve(answer);
    };
    socket.once("connect", () => settle(true));
    // ECONNREFUSED is the answer we want: the port is reachable, nothing is there.
    socket.once("error", () => settle(false));
    socket.once("timeout", () => settle(false));
  });
}

/** Run a command for its stdout, or give back "" if it is missing or fails. */
function output(file, args) {
  try {
    return execFileSync(file, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

/** The pids listening on the port — one per address family, so deduplicated. */
function listeners() {
  if (windows) {
    return [
      ...new Set(
        output("netstat", ["-ano", "-p", "tcp"])
          .split("\n")
          .filter((line) => line.includes("LISTENING") && /:(\d+)\s/.test(line))
          .filter((line) => Number(line.match(/:(\d+)\s/)[1]) === port)
          .map((line) => Number(line.trim().split(/\s+/).pop()))
          .filter(Number.isInteger),
      ),
    ];
  }
  return [
    ...new Set(
      output("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"])
        .split("\n")
        .map((line) => Number(line.trim()))
        .filter(Number.isInteger)
        .filter(Boolean),
    ),
  ];
}

/** A process's parent pid and full command line, or null if it is already gone. */
function describe(pid) {
  if (windows) {
    const line = output("powershell", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `$p = Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}"; if ($p) { "$($p.ParentProcessId)|$($p.CommandLine)" }`,
    ]).trim();
    if (!line) return null;
    const [parent, ...rest] = line.split("|");
    return { parent: Number(parent), command: rest.join("|") };
  }
  const line = output("ps", ["-o", "ppid=,command=", "-p", String(pid)]).trim();
  if (!line) return null;
  const [parent, ...rest] = line.split(/\s+/);
  return { parent: Number(parent), command: rest.join(" ") };
}

// Path comparison, not name matching: a command line that spells out this very
// directory belongs to this project, whatever binary is at the front of it.
// Separators are levelled because the same path is written both ways on Windows,
// and case is dropped because that filesystem does not keep it either.
const here = process.cwd().replaceAll(sep, "/").toLowerCase();
const ours = (command) => command.replaceAll("\\", "/").toLowerCase().includes(here);

/**
 * The listener plus every unbroken ancestor that is also this project's.
 *
 * The chain matters because `next dev` supervises the server it spawns: kill
 * the child alone and the parent hands the port straight back to a new one.
 * It ends on its own at the shell that started the run, whose command line
 * names the script but not the directory.
 */
function ownedChain(pid) {
  const chain = [];
  const seen = new Set();
  for (let current = pid; current > 0 && !seen.has(current); ) {
    seen.add(current);
    const process = describe(current);
    if (!process || !ours(process.command)) break;
    chain.push(current);
    current = process.parent;
  }
  return chain;
}

/** Stop a process and whatever it spawned. */
function stop(pid) {
  if (windows) output("taskkill", ["/PID", String(pid), "/T", "/F"]);
  else output("kill", ["-9", String(pid)]);
}

function refuse(reclaimed) {
  console.error(
    `\n  Port ${port} already has a server on it, so this dev server will not start.\n\n` +
      (reclaimed
        ? `  It is this project's own dev server, but it did not let go of the port.\n  Stop it and try again:\n\n`
        : `  It is not a 24X7 dev server, so it has been left alone.\n  Reuse it — open http://localhost:${port} — or stop it and try again:\n\n`) +
      `    Windows   netstat -ano | findstr :${port}     then  taskkill /PID <pid> /F\n` +
      `    macOS     lsof -ti tcp:${port} | xargs kill\n\n` +
      `  Next.js would otherwise move to the next free port without stopping, and the\n` +
      `  tab still pointed at :${port} would answer 404 for every route.\n`,
  );
  process.exit(1);
}

if (!(await occupied())) process.exit(0);

// Topmost first, so the supervisor is gone before the server it would restart.
const chain = listeners().flatMap(ownedChain).reverse();
if (chain.length === 0) refuse(false);

console.error(`\n  Port ${port} was still held by an earlier 24X7 dev server. Stopping it.\n`);
for (const pid of chain) stop(pid);

// A killed server releases the port a moment after the kill returns, so give it
// that moment rather than racing `next dev` into the same collision.
const deadline = Date.now() + RELEASE_MS;
while (await occupied()) {
  if (Date.now() > deadline) refuse(true);
  await new Promise((resolve) => setTimeout(resolve, 150));
}
