function R(e){return new Worker(""+new URL("worker-BiBF7R8x.js",import.meta.url).href,{name:e?.name})}function L(e){throw new Error(`web boot: unknown index injection row ${JSON.stringify(e)}`)}async function T(e,t){for(const r of e)switch(r.kind){case"global":globalThis[r.name]=r.value;break;case"script":{const o=document.createElement("script");o.textContent=r.text,(r.placement==="head"?document.head:document.body).append(o);break}case"script-src":await t(r.src);break;case"script-preload":break;case"style":{const o=document.createElement("style");o.textContent=r.text,document.head.append(o);break}case"html":(r.placement==="head"?document.head:document.body).insertAdjacentHTML("beforeend",r.html);break;default:L(r)}}const $="vfs-image.tar.gz";function g(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)?e:void 0}function _(e){const t=g(e);if(t?.version!==1||!Array.isArray(t.fixtures))throw new Error(`preview fixture manifest must use version ${String(1)}`);const r=[],o=new Set;for(const n of t.fixtures){const a=g(n),i=a?.id,c=a?.label,d=a?.description,p=a?.overlays,l=Array.isArray(p)?p.filter(u=>typeof u=="string"&&u.length>0):[];if(typeof i!="string"||!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(i)||i==="none"||i==="webfs"||typeof c!="string"||c.length===0||typeof d!="string"||d.length===0||!Array.isArray(p)||p.length===0||l.length!==p.length)throw new Error("preview fixture manifest contains an invalid fixture entry");if(o.has(i))throw new Error(`preview fixture manifest repeats id "${i}"`);o.add(i),r.push({id:i,label:c,description:d,overlays:l})}const s=t.defaultFixture;if(s!==null&&(typeof s!="string"||!o.has(s)))throw new Error("preview fixture manifest defaultFixture does not name a fixture");return{version:1,defaultFixture:s,fixtures:r}}const U=`
  [data-preview-text-viewer] {
    width: min(960px, calc(100vw - 32px));
    height: min(720px, calc(100dvh - 32px));
    padding: 0;
    box-sizing: border-box;
    border: 1px solid var(--dsw-alias-border-l2, rgb(0 0 0 / 10%));
    border-radius: var(--dsw-radius-lg, 16px);
    color: var(--dsw-alias-label-primary, #0f1115);
    background: var(--dsw-alias-bg-base, #fff);
    font-family: var(--dsw-font-family, inherit);
  }
  [data-preview-text-viewer][open] { display: flex; flex-direction: column; }
  [data-preview-text-viewer]::backdrop { background: rgb(0 0 0 / 32%); }
  [data-preview-text-viewer] header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--dsw-alias-border-l1, rgb(0 0 0 / 6%));
  }
  [data-preview-text-viewer] h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: 14px;
    line-height: 22px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [data-preview-text-viewer] button {
    height: 28px;
    padding: 0 12px;
    border: 1px solid var(--dsw-alias-border-l2, rgb(0 0 0 / 10%));
    border-radius: var(--dsw-radius-sm, 8px);
    color: inherit;
    background: transparent;
    font: inherit;
    cursor: pointer;
  }
  [data-preview-text-viewer] pre {
    flex: 1;
    margin: 0;
    padding: 16px;
    overflow: auto;
    background: var(--dsw-alias-markdown-code-block, transparent);
    font: 13px/20px ui-monospace, SFMono-Regular, Menlo, monospace;
    white-space: pre;
  }
`;function A(e,t){let r=document.querySelector("dialog[data-preview-text-viewer]");if(r===null){const s=document.createElement("style");s.textContent=U,document.head.append(s),r=document.createElement("dialog"),r.dataset.previewTextViewer="";const n=document.createElement("header"),a=document.createElement("h2"),i=document.createElement("button");i.type="button",i.textContent="Close";const c=r;i.addEventListener("click",()=>{c.close()}),r.addEventListener("keydown",d=>{d.stopPropagation()}),n.append(a,i),r.append(n,document.createElement("pre")),document.body.append(r)}const o=r.querySelector("h2");o.textContent=e,o.title=e,r.querySelector("pre").textContent=t,r.open||r.showModal()}var f=class extends Error{dshRemoteStreamFailure;constructor(e,t){super(e.message,t),this.name="TunnelLogicalStreamError",this.dshRemoteStreamFailure=e.kind==="remote"?{kind:"remote",code:e.code,details:e.details}:{kind:"carrier"}}},M=class{frames=[];wake;failed=!1;failure;push(e){this.failed||(this.frames.push(e),this.wake?.(),this.wake=void 0)}fail(e){this.failed||(this.failed=!0,this.failure=e,this.frames.length=0,this.wake?.(),this.wake=void 0)}async next(){for(;this.frames.length===0;){if(this.failed)throw this.failure;await new Promise(e=>{this.wake=e})}return this.frames.shift()}};const F=500,k=new TextEncoder,w=/\/\/# sourceMappingURL=([^\r\n]+)\s*$/,x=32*1024;function O(e){const t=k.encode(e);let r="";for(let o=0;o<t.length;o+=x)r+=String.fromCharCode(...t.subarray(o,o+x));return btoa(r)}async function P(e,t,r){const o=w.exec(e);if(o?.[1]===void 0)return e;try{const s=await r(new URL(o[1],new URL(t,globalThis.location.origin)));if(!s.ok)return e.replace(w,"");const n=`data:application/json;charset=utf-8;base64,${O(await s.text())}`;return e.replace(w,`//# sourceMappingURL=${n}`)}catch{return e.replace(w,"")}}function j(e){if(e!=null){if(typeof e=="string")return k.encode(e).buffer;if(e instanceof Blob||e instanceof ReadableStream||e instanceof ArrayBuffer)return e;if(ArrayBuffer.isView(e))return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength);throw new Error(`web-preview tunnel: unsupported request body ${Object.prototype.toString.call(e)}`)}}const I=new Set([101,204,205,304]);var B=class{worker;nextId=1;unary=new Map;bodyStreams=new Map;logicalStreams=new Map;inFlight=new Map;releases=new Map;constructor(e){this.worker=e,e.addEventListener("message",t=>{this.receive(t.data)}),e.addEventListener("error",t=>{const r=new Error(`web-preview tunnel: worker failed: ${t.message}`);for(const s of this.inFlight.keys())this.warnRefusal(s,`worker failed: ${t.message}`);this.inFlight.clear();for(const s of this.unary.values())s.reject(r);this.unary.clear();for(const s of this.bodyStreams.values())s.error(r);this.bodyStreams.clear();const o=new f({kind:"carrier",message:`web-preview tunnel: worker failed: ${t.message}`},{cause:r});for(const{inbox:s}of this.logicalStreams.values())s.fail(o);this.logicalStreams.clear();for(const s of this.releases.values())s();this.releases.clear()})}init(e,t=[]){this.worker.postMessage({t:"init",image:e,overlays:t})}fetch=async(e,t)=>{const r=t?.signal;if(r?.aborted===!0)throw new DOMException("The operation was aborted.","AbortError");const o=this.nextId++,s=t?.body===void 0||t.body===null?void 0:j(t.body),n={t:"req",id:o,method:t?.method??"GET",url:new URL(e,globalThis.location.origin).toString(),headers:Object.fromEntries(new Headers(t?.headers).entries()),...s===void 0?{}:{body:s}},a=new Promise((c,d)=>{this.unary.set(o,{resolve:c,reject:d})});if(this.inFlight.set(o,`${n.method} ${n.url}`),s instanceof ReadableStream?this.worker.postMessage(n,[s]):this.worker.postMessage(n),r==null)return await a;const i=this.rejectOnAbort(o,r);try{const c=await Promise.race([a,i.rejected]);return this.bodyStreams.has(o)&&this.observeStreamAbort(o,r),c}finally{i.release()}};async*open(e,t,r,o){r.throwIfAborted();const s=this.nextId++,n=new M,a={inbox:n,pump:void 0};let i=!1,c=!1;const d=()=>{n.fail(r.reason)};r.addEventListener("abort",d,{once:!0}),this.logicalStreams.set(s,a),this.inFlight.set(s,`STREAM ${e}`);try{const p={t:"stream-open",id:s,endpoint:e,payload:t};try{this.worker.postMessage(p),i=!0}catch(l){throw new f({kind:"carrier",message:`web-preview tunnel: failed to open Remote stream ${e}`},{cause:l})}for(o!==void 0&&(a.pump=this.pumpUplink(s,o,r,n));;){const l=await n.next();if(r.throwIfAborted(),l.t==="stream-item"){yield l.value;continue}if(c=!0,l.t==="stream-error")throw new f(l.failure);return}}finally{r.removeEventListener("abort",d),this.logicalStreams.delete(s),this.inFlight.delete(s),a.pump?.stop(),i&&!c&&this.abortWorkerOperation(s),a.pump!==void 0&&await a.pump.done}}pumpUplink(e,t,r,o){const s=Promise.withResolvers(),n=t[Symbol.asyncIterator](),a={active:!0,released:!1},i=()=>{a.released||(a.released=!0,Promise.resolve(n.return?.()).catch(()=>{}))};return{done:this.forwardUplink(e,n,s.promise,()=>a.active&&!r.aborted).then(c=>{a.released||=c},c=>{o.fail(c)}).then(i),stop:()=>{a.active=!1,s.resolve({value:void 0,done:!0}),i()}}}async forwardUplink(e,t,r,o){for(;;){const s=await Promise.race([t.next(),r]);if(!o())return!1;if(s.done===!0)break;this.worker.postMessage({t:"stream-uplink-item",id:e,value:s.value})}return this.worker.postMessage({t:"stream-uplink-end",id:e}),!0}async bootPayload(){const e=await this.fetch("/__boot__");if(!e.ok)throw new Error(`web-preview tunnel: boot payload failed with HTTP ${String(e.status)}: ${await e.text()}`);return await e.json()}async loadBundle(e){const t=await this.fetch(e);if(!t.ok)throw new Error(`web-preview tunnel: bundle ${e} failed with HTTP ${String(t.status)}`);const r=await P(await t.text(),e,this.fetch),o=URL.createObjectURL(new Blob([r],{type:"text/javascript"}));try{await new Promise((s,n)=>{const a=document.createElement("script");a.src=o,a.addEventListener("load",()=>{a.remove(),s()},{once:!0}),a.addEventListener("error",()=>{a.remove(),n(new Error(`web-preview tunnel: bundle ${e} failed to execute`))},{once:!0}),document.head.append(a)})}finally{URL.revokeObjectURL(o)}}rejectOnAbort(e,t){let r=()=>{};return{rejected:new Promise((o,s)=>{const n=()=>{s(this.abortRequest(e))};if(t.aborted){n();return}t.addEventListener("abort",n,{once:!0}),r=()=>{t.removeEventListener("abort",n)}}),release:r}}abortRequest(e){this.unary.delete(e);const t=this.bodyStreams.get(e);this.bodyStreams.delete(e),this.inFlight.delete(e),this.releases.delete(e),this.abortWorkerOperation(e);const r=new DOMException("The operation was aborted.","AbortError");return t?.error(r),r}observeStreamAbort(e,t){const r=()=>{this.abortRequest(e)};t.addEventListener("abort",r,{once:!0}),this.releases.set(e,()=>{t.removeEventListener("abort",r)})}releaseSignal(e){const t=this.releases.get(e);this.releases.delete(e),t?.()}cancelStream(e){this.releaseSignal(e),this.bodyStreams.delete(e),this.inFlight.delete(e),this.abortWorkerOperation(e)}abortWorkerOperation(e){const t={t:"abort",id:e};try{this.worker.postMessage(t)}catch{}}warnRefusal(e,t){console.warn(`web-preview tunnel: request ${String(e)} ${this.inFlight.get(e)??"(unknown request)"} → ${t}`)}receive(e){switch(e.t){case"res":{const t=this.unary.get(e.id);if(t===void 0)return;e.status>=F&&this.warnRefusal(e.id,`HTTP ${String(e.status)}${e.message===void 0?"":`: ${e.message}`}`),this.unary.delete(e.id),this.inFlight.delete(e.id);const r=I.has(e.status)?null:e.body??e.message??null;t.resolve(new Response(r,{status:e.status,headers:e.headers}));return}case"res-head":{const t=this.unary.get(e.id);if(t===void 0)return;this.unary.delete(e.id);const r=new ReadableStream({start:o=>{this.bodyStreams.set(e.id,o)},cancel:()=>{this.cancelStream(e.id)}});t.resolve(new Response(r,{status:e.status,headers:e.headers}));return}case"res-chunk":this.bodyStreams.get(e.id)?.enqueue(new Uint8Array(e.chunk));return;case"res-end":{const t=this.bodyStreams.get(e.id);if(t===void 0)return;this.bodyStreams.delete(e.id),this.inFlight.delete(e.id),this.releaseSignal(e.id),t.close();return}case"res-err":{const t=new Error(`web-preview tunnel: ${e.message}`);this.warnRefusal(e.id,`res-err: ${e.message}`);const r=this.unary.get(e.id);if(this.inFlight.delete(e.id),r!==void 0){this.unary.delete(e.id),r.reject(t);return}const o=this.bodyStreams.get(e.id);if(o===void 0)return;this.bodyStreams.delete(e.id),this.releaseSignal(e.id),o.error(t);return}case"view-text":A(e.path,e.text);return;case"stream-item":case"stream-end":case"stream-error":{const t=this.logicalStreams.get(e.id);if(t===void 0)return;t.inbox.push(e),e.t!=="stream-item"&&t.pump?.stop();return}default:throw new Error(`web-preview tunnel: unknown frame ${JSON.stringify(e)}`)}}};const b="none",z="webfs",C="preview-fixture",W=`
  [data-preview-source-chooser] {
    position: fixed;
    inset: 0;
    z-index: 1200;
    display: grid;
    place-items: center;
    overflow: auto;
    padding: 24px;
    box-sizing: border-box;
    color: #0f1115;
    background: #fff;
    font-size: 14px;
    line-height: 22px;
  }
  [data-preview-source-card] {
    width: min(600px, 100%);
    max-height: calc(100dvh - 48px);
    box-sizing: border-box;
    padding: 28px;
    overflow-y: auto;
    border: 1px solid transparent;
    border-radius: 24px;
    background: #fff;
    box-shadow: 0 0 1px rgb(0 0 0 / 20%), 0 12px 32px rgb(0 0 0 / 8%);
  }
  [data-preview-source-card] h1 {
    margin: 0;
    font-size: 20px;
    line-height: 28px;
    font-weight: 500;
  }
  [data-preview-source-card] > p {
    margin: 8px 0 0;
    color: #61666b;
  }
  [data-preview-source-card] fieldset {
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin: 24px 0 0;
    padding: 0;
    border: 0;
  }
  [data-preview-source-card] legend {
    margin: 0 0 8px;
    padding: 0 4px;
    color: #61666b;
    font-size: 13px;
    line-height: 20px;
    font-weight: 500;
  }
  [data-preview-source-option] {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 8px;
    min-height: 56px;
    padding: 8px 12px 8px 8px;
    box-sizing: border-box;
    border: 1px solid transparent;
    border-radius: 12px;
    background: transparent;
    cursor: pointer;
    transition: background-color 120ms ease, border-color 120ms ease;
  }
  [data-preview-source-option]:hover:not(:has(input:disabled)),
  [data-preview-source-option]:has(input:checked) {
    background: rgb(38 49 72 / 6%);
  }
  [data-preview-source-option]:has(input:checked) {
    border-color: rgb(0 0 0 / 10%);
  }
  [data-preview-source-option]:has(input:disabled) {
    cursor: default;
    opacity: 0.4;
  }
  [data-preview-source-option] input {
    flex: none;
    width: 16px;
    height: 16px;
    margin: 4px 0 0;
    accent-color: #0f1115;
  }
  [data-preview-source-option] > span { flex: 1; min-width: 0; }
  [data-preview-source-option] strong {
    display: block;
    font-size: 14px;
    line-height: 24px;
    font-weight: 500;
  }
  [data-preview-source-option] strong + span {
    display: block;
    color: #81858c;
    font-size: 14px;
    line-height: 24px;
  }
  [data-preview-source-submit] {
    display: block;
    min-width: 120px;
    height: 36px;
    margin: 24px 0 0 auto;
    padding: 0 14px;
    border: 0;
    border-radius: 18px;
    color: #fff;
    background: #0f1115;
    font-size: 14px;
    line-height: 22px;
    cursor: pointer;
    transition: background-color 120ms ease;
  }
  [data-preview-source-submit]:hover:not(:disabled) {
    background: #43454a;
  }
  [data-preview-source-submit]:focus-visible {
    outline: 2px solid rgb(0 0 0 / 16%);
    outline-offset: 2px;
  }
  [data-preview-source-submit]:disabled { cursor: not-allowed; opacity: 0.5; }
  @media (prefers-color-scheme: dark) {
    [data-preview-source-chooser] {
      color: #f9fafb;
      background: #151517;
    }
    [data-preview-source-card] { border-color: rgb(255 255 255 / 6%); background: #2c2c2e; }
    [data-preview-source-card] > p, [data-preview-source-card] legend { color: #cfd3d6; }
    [data-preview-source-option] strong + span { color: #adb2b8; }
    [data-preview-source-option]:hover:not(:has(input:disabled)),
    [data-preview-source-option]:has(input:checked) { background: rgb(255 255 255 / 8%); }
    [data-preview-source-option]:has(input:checked) { border-color: rgb(255 255 255 / 12%); }
    [data-preview-source-option] input { accent-color: #f9fafb; }
    [data-preview-source-submit] { color: #0f1115; background: #f9fafb; }
    [data-preview-source-submit]:hover:not(:disabled) { background: #ebeef2; }
    [data-preview-source-submit]:focus-visible { outline-color: rgb(255 255 255 / 20%); }
  }
  @media (max-width: 560px) {
    [data-preview-source-card] { padding: 24px; }
    [data-preview-source-submit] { width: 100%; }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-preview-source-option], [data-preview-source-submit] { transition: none; }
  }
`,q={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};function y(e){return e.replace(/[&<>"']/g,t=>q[t]??t)}function H(e,t){return`<label data-preview-source-option>
    <input type="radio" name="preview-source" value="${e.id}"${e.id===t?" checked":""}${e.disabled===!0?" disabled":""}>
    <span>
      <strong>${y(e.label)}</strong>
      <span>${y(e.description)}</span>
    </span>
  </label>`}function D(e,t){return e.map(r=>({id:r.id,label:r.label,description:r.description,overlays:r.overlays.map(o=>new URL(o,t))}))}async function N(e){const t=new URL(location.href).searchParams.get(C);if(t===b)return[];const r=await fetch(e);if(!r.ok)throw new Error(`preview source chooser: fixture manifest returned ${String(r.status)}`);const o=_(await r.json()),s=[{id:b,label:"Empty environment",description:"Load only the base runtime to verify first launch and workspace creation.",overlays:[]},...D(o.fixtures,e),{id:z,label:"WebFS directory",description:"Requires directory access and will be available after the WebFS provider lands.",overlays:[],disabled:!0}];if(t!==null){const u=s.find(h=>h.id===t&&h.disabled!==!0);if(u===void 0)throw new Error(`preview source chooser: unknown or interactive source "${t}"`);return u.overlays}const n=document.getElementById("root");if(n===null)throw new Error("preview source chooser: missing #root");const a=o.defaultFixture??b,i=document.createElement("style");i.dataset.previewSourceStyle="",i.textContent=W,document.head.append(i);const c=document.createElement("main");c.dataset.previewSourceChooser="",c.innerHTML=`<form data-preview-source-card aria-labelledby="preview-source-title">
      <h1 id="preview-source-title">Choose Preview data</h1>
      <p>Data mounts before the Worker and application start. Refresh to choose again.</p>
      <fieldset>
        <legend>Filesystem source</legend>
        ${s.map(u=>H(u,a)).join("")}
      </fieldset>
      <button data-preview-source-submit type="submit">Start Preview</button>
    </form>`,n.prepend(c);const d=c.querySelector("[data-preview-source-card]");if(d===null)throw new Error("preview source chooser: form was not rendered");const p=await new Promise((u,h)=>{d.addEventListener("submit",E=>{E.preventDefault();const m=new FormData(d).get("preview-source");typeof m=="string"?u(m):h(new Error("preview source chooser: no source selected"))},{once:!0})}),l=s.find(u=>u.id===p&&u.disabled!==!0);if(l===void 0)throw new Error(`preview source chooser: unavailable source "${p}"`);return c.remove(),i.remove(),l.overlays}function v(){return globalThis.__DSH_BOOT_READY__??=Promise.withResolvers()}function Y(){v().promise.catch(()=>{})}async function V(e={}){Y();const t=new URL(e.image??"vfs-image.tar.gz",document.baseURI),r=new URL(e.fixtureManifest??"fixtures.json",t);try{return{overlays:await N(r)}}catch(o){throw v().reject(o),o}}async function G(e,t){const r=v();r.promise.catch(()=>{});try{const o=new B(e);o.init(new URL(t?.image??"vfs-image.tar.gz",document.baseURI).href,(t?.overlays??[]).map(n=>new URL(n,document.baseURI).href));const s=await o.bootPayload();return globalThis.__DSH_TRANSPORT__={fetch:(n,a)=>o.fetch(n,a),openStream:(n,a,i,c)=>o.open(n,a,i,c),loadBundle:n=>o.loadBundle(n),ownsHost:!0},globalThis.__DSH_FILE_UPLOAD__={fetch:(n,a)=>o.fetch(n,a)},await T(s.injections,n=>o.loadBundle(n)),r.resolve(),{worker:e,tunnel:o,loadBundle:n=>o.loadBundle(n)}}catch(o){throw r.reject(o),o}}const S=`preview/${$}`,J=await V({image:S});await G(new R({name:"dsh-host"}),{image:S,overlays:J.overlays});
//# sourceMappingURL=bootstrap-D-FiIdwd.js.map
