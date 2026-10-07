// Starts the built server (npm run build first) and checks the /repeat route.
// Uses only Node's built-in test runner and fetch, so it adds no dependencies.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 19000 + Math.floor(Math.random() * 1000);

test("GET /repeat repeats the greeting", async (t) => {
  const server = spawn(process.execPath, ["dist/server.js"], { env: { ...process.env, PORT: String(port) }, stdio: "ignore" });
  t.after(() => server.kill());
  let response;
  for (let attempt = 0; attempt < 50 && !response; attempt++) {
    response = await fetch(`http://127.0.0.1:${port}/healthz`).catch(() => undefined);
    if (!response) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(response, "server did not answer within 5 seconds");
  const repeated = await fetch(`http://127.0.0.1:${port}/repeat?times=2`);
  assert.equal(repeated.status, 200);
  assert.deepEqual(await repeated.json(), { times: 2, text: "hello hello" });
});
