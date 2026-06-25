const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 8788);
const ROOT = __dirname;
const PUBLIC_DIR = fs.existsSync(path.join(ROOT, "public", "index.html"))
  ? path.join(ROOT, "public")
  : ROOT;
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "sessions.json");

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

function readSessions() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(sessions, null, 2), "utf8");
}

function send(res, status, body, type = "application/json") {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(status, {
    "Content-Type": `${type}; charset=utf-8`,
    "Content-Length": buffer.length,
    "Cache-Control": type === "application/json" ? "no-store" : "public, max-age=60"
  });
  res.end(buffer);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Body too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html";
  if (ext === ".js") return "application/javascript";
  if (ext === ".css") return "text/css";
  if (ext === ".json") return "application/json";
  return "application/octet-stream";
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const safePath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath.replaceAll("..", "")));
  if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, "Forbidden", "text/plain");
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain");
    send(res, 200, data, contentType(filePath));
  });
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, JSON.stringify({ ok: true }));
  }

  if (req.method === "GET" && url.pathname === "/api/sessions") {
    return send(res, 200, JSON.stringify(readSessions()));
  }

  if (req.method === "POST" && url.pathname === "/api/sessions") {
    const item = await readBody(req);
    const sessions = readSessions();
    const now = new Date().toISOString();
    const saved = { id: crypto.randomUUID(), ...item, createdAt: now, updatedAt: now };
    sessions.push(saved);
    writeSessions(sessions);
    return send(res, 201, JSON.stringify(saved));
  }

  if (url.pathname.startsWith("/api/sessions/")) {
    const id = decodeURIComponent(url.pathname.replace("/api/sessions/", ""));
    const sessions = readSessions();

    if (req.method === "DELETE") {
      writeSessions(sessions.filter(session => session.id !== id));
      return send(res, 200, JSON.stringify({ ok: true }));
    }
  }

  send(res, 404, JSON.stringify({ error: "Not found" }));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname.startsWith("/api/")) {
    handleApi(req, res, url).catch(error => {
      console.error(error);
      send(res, 500, JSON.stringify({ error: "Server error" }));
    });
    return;
  }
  serveStatic(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Planning Club Velo lance sur le port ${PORT}`);
});
