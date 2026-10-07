import http from "node:http";
import { trace } from "@opentelemetry/api";
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
});

const port = Number.parseInt(process.env.PORT ?? "8080", 10);
const serviceName = process.env.OTEL_SERVICE_NAME ?? "swhurl-app";

function handle(request: http.IncomingMessage, response: http.ServerResponse, url: URL): void {
  const start = Date.now();
  const email = request.headers["x-auth-request-email"];
  const user = request.headers["x-auth-request-user"];
  const span = trace.getActiveSpan();

  if (url.pathname === "/healthz") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === "/repeat") {
    const times = Math.min(Number.parseInt(url.searchParams.get("times") ?? "1", 10), 100);
    const text = "hello ".repeat(times).trim();
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ times, text }));
    logger.info({ method: request.method, path: url.pathname, status: 200, duration_ms: Date.now() - start }, "request handled");
    return;
  }

  const body = {
    message: `hello from ${serviceName} (auto-deployed)`,
    service: serviceName,
    path: url.pathname,
    user: typeof user === "string" ? user : null,
    email: typeof email === "string" ? email : null,
    traceId: span?.spanContext().traceId ?? null,
  };

  response.writeHead(200, { "content-type": "application/json" });
  response.end(JSON.stringify(body, null, 2));

  logger.info({
    method: request.method,
    path: url.pathname,
    status: 200,
    duration_ms: Date.now() - start,
    user: body.user,
    email: body.email,
    trace_id: body.traceId,
  }, "request handled");
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  try {
    handle(request, response, url);
  } catch (err) {
    logger.error({ err, method: request.method, path: url.pathname, status: 500 }, "request failed");
    if (!response.headersSent) response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: "internal error" }));
  }
});

server.listen(port, "0.0.0.0", () => {
  logger.info({ port, service: serviceName }, "server listening");
});

