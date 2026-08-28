import assert from "node:assert/strict";
import WebSocket from "ws";
const target = (
  await fetch("http://127.0.0.1:9222/json").then((r) => r.json())
).find((x) => x.type === "page");
assert.ok(target);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => {
  ws.once("open", r);
  ws.once("error", j);
});
let id = 0;
const pending = new Map(),
  errors = [];
ws.on("message", (raw) => {
  const m = JSON.parse(raw);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
  if (m.method === "Runtime.exceptionThrown")
    errors.push(
      m.params.exceptionDetails.exception?.description ??
        m.params.exceptionDetails.text,
    );
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error")
    errors.push(m.params.args.map((x) => x.value ?? x.description).join(" "));
  if (
    m.method === "Log.entryAdded" &&
    m.params.entry.level === "error" &&
    !m.params.entry.url?.endsWith("/favicon.ico")
  )
    errors.push(m.params.entry.text);
});
const call = (method, params = {}) =>
    new Promise((r) => {
      const n = ++id;
      pending.set(n, r);
      ws.send(JSON.stringify({ id: n, method, params }));
    }),
  evaluate = async (expression) =>
    (
      await call("Runtime.evaluate", {
        expression,
        awaitPromise: true,
        returnByValue: true,
      })
    ).result.result.value,
  wait = (n = 180) => new Promise((r) => setTimeout(r, n));
await call("Runtime.enable");
await call("Log.enable");
await call("Page.enable");
await call("Page.navigate", {
  url: "http://127.0.0.1:3000/dev/dynamic-workspace",
});
let ready = false;
for (let i = 0; i < 40 && !ready; i++) {
  await wait(250);
  ready = await evaluate(
    "Boolean(document.querySelector('[data-mv5-authoring-verification]'))",
  );
}
assert.equal(ready, true);
const click = async (label) => {
  const ok = await evaluate(
    `(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===${JSON.stringify(label)});if(!b)return false;b.click();return true})()`,
  );
  assert.equal(ok, true, `Missing ${label}`);
  await wait();
};
await click("Load MV-4 Fixture");
await click("Author VI Midpoint");
assert.equal(
  await evaluate(
    "document.querySelector('[data-mv5-verification-status]').textContent",
  ),
  "VERIFIED",
);
const vi = await evaluate(
  "(()=>{const g=[...document.querySelectorAll('[data-semantic-id]')].find(x=>x.textContent==='C');return {id:g.dataset.semanticId,cx:g.querySelector('circle').getAttribute('cx'),cy:g.querySelector('circle').getAttribute('cy')}})()",
);
assert.match(
  await evaluate(
    "document.querySelector('[data-mv5-authoring-verification] details').textContent",
  ),
  /CREATE_MIDPOINT[\s\S]*MEASUREMENT/,
);
await click("Move A");
await click("Reverify MV-5");
assert.equal(
  await evaluate(
    "document.querySelector('[data-mv5-verification-status]').textContent",
  ),
  "VERIFIED",
);
const moved = await evaluate(
  "(()=>{const g=[...document.querySelectorAll('[data-semantic-id]')].find(x=>x.textContent==='C');return {id:g.dataset.semanticId,cx:g.querySelector('circle').getAttribute('cx'),cy:g.querySelector('circle').getAttribute('cy')}})()",
);
assert.equal(moved.id, vi.id);
assert.notDeepEqual(moved, vi);
await click("Load MV-4 Fixture");
await click("Author EN Midpoint");
const en = await evaluate(
  "(()=>{const g=[...document.querySelectorAll('[data-semantic-id]')].find(x=>x.textContent==='C');return {cx:g.querySelector('circle').getAttribute('cx'),cy:g.querySelector('circle').getAttribute('cy')}})()",
);
assert.deepEqual(en, { cx: vi.cx, cy: vi.cy });
assert.equal(
  await evaluate(
    "document.querySelector('[data-mv5-runtime-fallback]').textContent",
  ),
  "RUNTIME_FALLBACK",
);
assert.deepEqual(errors, []);
console.log(
  "MV_5_BROWSER_AUTHORING=PASS\nMV_5_BILINGUAL_BROWSER=PASS\nMV_5_RUNTIME_FALLBACK_BROWSER=PASS\nMV_5_VERIFICATION_EVIDENCE_BROWSER=PASS",
);
ws.close();
