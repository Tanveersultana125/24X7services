import { connect } from "node:net";

/**
 * Refuse to start when the dev port already has a server on it.
 *
 * `next dev` treats a busy port as a hint, not an error: it walks upwards until
 * something is free and prints the port it settled on once, in a line that
 * scrolls away. The browser meanwhile stays on the old URL, which is now either
 * a different project or a dead server — and every route answers 404 with
 * nothing to say why. Losing the tail of a stale dev server behind a fresh one
 * costs an afternoon of reading a working app's source for a bug it never had.
 *
 * So the port is fixed, and a collision stops here with the reason spelled out.
 *
 * The check dials the port rather than trying to bind it. Windows honours
 * SO_REUSEADDR on listening sockets, so a second bind to a port that is already
 * being served succeeds and a bind probe reports every port as free. A
 * successful connection does not.
 */

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("check-dev-port: pass the port to check, e.g. `node scripts/check-dev-port.mjs 3200`.");
  process.exit(1);
}

/** No answer within this long counts as nothing listening. */
const TIMEOUT_MS = 1500;

function occupied() {
  console.error(
    `\n  Port ${port} already has a server on it, so this dev server will not start.\n\n` +
      `  It is almost always a 24X7 dev server from an earlier run that never exited.\n` +
      `  Reuse it — open http://localhost:${port} — or stop it and try again:\n\n` +
      `    Windows   netstat -ano | findstr :${port}     then  taskkill /PID <pid> /F\n` +
      `    macOS     lsof -ti tcp:${port} | xargs kill\n\n` +
      `  Next.js would otherwise move to the next free port without stopping, and the\n` +
      `  tab still pointed at :${port} would answer 404 for every route.\n`,
  );
  process.exit(1);
}

// 127.0.0.1, because that is the address the browser resolves localhost to and
// therefore the one a collision would actually be felt on.
const socket = connect({ port, host: "127.0.0.1" });
socket.setTimeout(TIMEOUT_MS);

socket.once("connect", () => {
  socket.destroy();
  occupied();
});

// ECONNREFUSED is the answer we want: the port is reachable and nothing is there.
socket.once("error", () => {
  socket.destroy();
  process.exit(0);
});

socket.once("timeout", () => {
  socket.destroy();
  process.exit(0);
});
