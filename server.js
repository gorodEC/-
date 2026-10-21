import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const API_KEY = process.env.MEDIASTACK_API_KEY;
const API_URL = "https://api.apilayer.net/mediastack/news";
const CACHE_MS = 15 * 60 * 1000;
let cached = null;
let cachedAt = 0;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "same-origin"
  });
  res.end(JSON.stringify(data));
}

async function getNews() {
  if (cached && Date.now() - cachedAt < CACHE_MS) return cached;
  if (!API_KEY) {
    const error = new Error("Не задан MEDIASTACK_API_KEY. Скопируйте .env.example в .env и добавьте свой ключ Mediastack.");
    error.status = 503;
    throw error;
  }

  const url = new URL(API_URL);
  url.searchParams.set("access_key", API_KEY);
  url.searchParams.set("languages", "ru");
  url.searchParams.set("limit", "100");
  url.searchParams.set("sort", "published_desc");

  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) {
    const message = payload.error?.message || payload.error?.info || `Mediastack ответил HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status === 429 ? 429 : 502;
    throw error;
  }
  if (!Array.isArray(payload.data)) {
    const error = new Error("Ответ Mediastack не содержит список статей. Проверьте API endpoint и ключ.");
    error.status = 502;
    throw error;
  }

  // Enforce the Russian-language constraint again on the server.
  // Do not restrict countries here: the API's supported-country list may not include Russia.
  const data = payload.data.filter(article =>
    String(article.language || "").toLowerCase().split(/[-_]/)[0] === "ru" &&
    /[А-Яа-яЁё]{2}/.test(`${article.title || ""} ${article.description || ""}`)
  );
  cached = { data, total: data.length, cached: false };
  cachedAt = Date.now();
  return cached;
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (requestUrl.pathname === "/api/news") {
    if (req.method !== "GET") return sendJson(res, 405, { error: "Разрешён только GET" });
    try {
      const result = await getNews();
      return sendJson(res, 200, { ...result, cached: Date.now() - cachedAt >= 0 });
    } catch (error) {
      console.error("Mediastack error:", error.message);
      return sendJson(res, error.status || 502, { error: error.message });
    }
  }

  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.resolve(__dirname, `.${pathname}`);
  if (!filePath.startsWith(__dirname + path.sep)) return sendJson(res, 403, { error: "Forbidden" });
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`Новости.ру: http://localhost:${PORT}`);
  if (!API_KEY) console.warn("Не задан MEDIASTACK_API_KEY. Добавьте его в переменные окружения или файл .env.");
});
