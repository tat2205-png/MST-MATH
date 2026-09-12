import { chromium } from "playwright-core";

const executablePath = process.env.MST07_CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ headless: true, executablePath });
try {
  const page = await browser.newPage();
  const response = await page.goto("https://www.geogebra.org/apps/deployggb.js", { waitUntil: "domcontentloaded", timeout: 30_000 });
  if (!response || !response.ok()) throw new Error(`DEPLOYGGB_HTTP_${response?.status() ?? "NO_RESPONSE"}`);
  await page.setContent(`<!doctype html><html><body><div id="ggb"></div><script src="https://www.geogebra.org/apps/deployggb.js"></script><script>window.__ggbReady = new Promise((resolve, reject) => { window.__ggbResolve = resolve; window.__ggbReject = reject; }); const applet = new GGBApplet({ appName: "3d", width: 800, height: 600, showToolBar: false, showAlgebraInput: false, showMenuBar: false, appletOnLoad: api => window.__ggbResolve(api) }, true); applet.inject("ggb");</script></body></html>`, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean((window as Window & { __ggbReady?: unknown }).__ggbReady), undefined, { timeout: 30_000 });
  const result = await page.evaluate(async () => {
    const api = await (window as unknown as Window & { __ggbReady: Promise<any> }).__ggbReady;
    const methods = ["evalCommand", "exists", "getCommandString", "getVersion", "getBase64", "setBase64"];
    const available = Object.fromEntries(methods.map(name => [name, typeof api?.[name] === "function"]));
    const evalResult = api.evalCommand("L=6");
    const prerequisites = ["W=4", "H=3", "t=0.5", 'LabelT=Text("t = "+round(t,2),(-2,W+H+1,0))'];
    const command48 = prerequisites.map(command => ({ command, result: api.evalCommand(command) }));
    return { available, engine_version: api.getVersion(), eval_L6: evalResult, exists_L: api.exists("L"), command_string_L: api.getCommandString("L", false), command48: command48.at(-1), labelT_exists: api.exists("LabelT"), labelT_command: api.getCommandString("LabelT", false) };
  });
  console.log(JSON.stringify({ browser_runtime: "Chrome", executable_path: executablePath, ...result }));
} finally { await browser.close(); }
