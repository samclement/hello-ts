// hello-ts's own route, asked through the app's routes (npm run build first).
import { test } from "node:test";
import assert from "node:assert/strict";

const { app } = await import("../dist/app.js");

test("GET /repeat repeats the greeting", async () => {
  const repeated = await app.request("/repeat?times=2");
  assert.equal(repeated.status, 200);
  assert.deepEqual(await repeated.json(), { times: 2, text: "hello hello" });
  assert.deepEqual(await (await app.request("/repeat")).json(), { times: 1, text: "hello" });
  assert.equal((await (await app.request("/repeat?times=1000")).json()).times, 100, "more than 100 is answered as 100");
  assert.equal((await app.request("/repeat?times=many")).status, 400);
});
