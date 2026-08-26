import assert from "node:assert/strict";
import WebSocket from "ws";

const targets=await fetch("http://127.0.0.1:9222/json").then(response=>response.json());
const target=targets.find(item=>item.type==="page");
assert.ok(target,"No browser debugging page target");
const socket=new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.once("open",resolve);socket.once("error",reject);});
let sequence=0;const pending=new Map(),errors=[];
socket.on("message",raw=>{const message=JSON.parse(raw);if(message.id&&pending.has(message.id)){pending.get(message.id)(message);pending.delete(message.id);}if(message.method==="Runtime.exceptionThrown")errors.push(message.params.exceptionDetails.exception?.description??message.params.exceptionDetails.text);if(message.method==="Runtime.consoleAPICalled"&&message.params.type==="error")errors.push(message.params.args.map(item=>item.value??item.description).join(" "));if(message.method==="Log.entryAdded"&&message.params.entry.level==="error"&&!message.params.entry.url?.endsWith("/favicon.ico"))errors.push(message.params.entry.text);if(message.method==="Network.loadingFailed")errors.push(`${message.params.errorText}: ${message.params.blockedReason??message.params.type}`);});
const call=(method,params={})=>new Promise(resolve=>{const id=++sequence;pending.set(id,resolve);socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>(await call("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true})).result.result.value;
const wait=(milliseconds=150)=>new Promise(resolve=>setTimeout(resolve,milliseconds));
await call("Runtime.enable");await call("Log.enable");await call("Network.enable");await call("Page.enable");await call("Emulation.setDeviceMetricsOverride",{width:1600,height:900,deviceScaleFactor:1,mobile:false});await call("Page.navigate",{url:"http://127.0.0.1:3000/dev/dynamic-workspace"});
let mounted=false;for(let attempt=0;attempt<40&&!mounted;attempt++){await wait(250);mounted=await evaluate("Boolean(document.querySelector('[data-mv3-workspace]'))");}if(!mounted){const diagnostic=await evaluate("JSON.stringify({url:location.href,body:document.body.innerText.slice(0,500),html:document.body.innerHTML.slice(0,500),resources:performance.getEntriesByType('resource').map(item=>item.name)})");throw new Error(`MV-3 workspace route did not mount: ${diagnostic}; console=${errors.join(" | ")}`);}
assert.equal(await evaluate("document.querySelectorAll('[aria-label=\"Workspace tools\"] button').length>20"),true,"Universal tool registry is not visible");
const click=async label=>{const found=await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(item=>item.textContent.trim()===${JSON.stringify(label)});if(!button)return false;button.click();return true;})()`);assert.equal(found,true,`Missing button ${label}`);await wait();};
await click("Point");
for(const [x,y] of [[.4,.45],[.6,.45]])await evaluate(`(()=>{const svg=document.querySelector('[aria-label="Dynamic math canvas"]'),box=svg.getBoundingClientRect();svg.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,clientX:box.left+box.width*${x},clientY:box.top+box.height*${y}}));return true;})()`);
await wait();assert.equal(await evaluate("document.querySelectorAll('[data-semantic-id]').length"),2);
await click("Line");
await evaluate("document.querySelectorAll('[data-semantic-id]')[0].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:2}))");await wait();await evaluate("document.querySelectorAll('[data-semantic-id]')[1].dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:3}))");await wait();
assert.equal(await evaluate("document.querySelectorAll('line[data-semantic-id]').length"),1,"Line tool did not route through construction engine");
await click("Select");await evaluate("document.querySelector('[data-semantic-id]').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:4}))");await wait();
assert.match(await evaluate("document.querySelector('[data-workspace-inspector]').innerText"),/Properties[\s\S]*Freedom:/);
await click("3D");assert.match(await evaluate("document.querySelector('[data-mv3-workspace] footer').innerText"),/Mode: 3D/);
await click("Save");assert.equal(await evaluate("localStorage.getItem('math-ai-studio:dynamic-workspace:v1')?.includes('dynamic-workspace/v1')"),true);
assert.deepEqual(errors,[],`Browser console errors: ${errors.join(" | ")}`);
console.log("MV_3_BROWSER_AUTOMATION=PASS\nMV_3_ACCESSIBILITY_SURFACE=PASS\nMV_3_PERSISTENCE_BROWSER=PASS\nNO_UI_OWNED_MATH=PASS");socket.close();
