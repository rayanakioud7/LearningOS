import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
function worker(){
 const events=new Map(),stores=new Map(),calls={fetch:0,skip:0,claim:0},base='http://localhost:4173/sw.js';
 const caches={async open(name){if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);return {async addAll(paths){for(const path of paths)store.set(new URL(path,base).href,new Response('cached '+path));},async match(key){return store.get(typeof key==='string'?key:key.url)?.clone();}};},async keys(){return [...stores.keys()];},async delete(key){return stores.delete(key);}};
 const self={location:new URL(base),addEventListener:(name,handler)=>events.set(name,handler),skipWaiting:()=>{calls.skip++;},clients:{claim:async()=>{calls.claim++;}}};
 vm.runInNewContext(source,{self,caches,URL,fetch:async()=>{calls.fetch++;return new Response('network');}});
 return {events,stores,calls,async install(){let task;events.get('install')({waitUntil:p=>task=p});await task;},async request(path){let response;events.get('fetch')({request:{method:'GET',url:new URL(path,base).href},respondWith:p=>response=p});return response&&await response;}};
}
test('offline app shell serves one installed version, including modules with query strings',async()=>{
 const w=worker();await w.install();assert.equal(await (await w.request('./app.js')).text(),'cached ./app.js');assert.equal(await (await w.request('./planner.js?v=next')).text(),'cached ./planner.js');assert.equal(w.calls.fetch,0);
});
test('a new worker waits for an explicit reload instead of replacing modules mid-session',async()=>{
 const w=worker();await w.install();assert.equal(w.calls.skip,0);w.events.get('message')({data:{type:'SKIP_WAITING'}});assert.equal(w.calls.skip,1);
});
test('health, external sources and private/non-app URLs are never cached',async()=>{
 const w=worker();await w.install();for(const path of ['/health','/personal-backup.json','https://example.com/private.pdf'])assert.equal(await w.request(path),undefined);
});
test('activation cleans older app caches while preserving unrelated caches',async()=>{
 const w=worker();await w.install();w.stores.set('ensam-old',new Map());w.stores.set('other-app',new Map());let task;w.events.get('activate')({waitUntil:p=>task=p});await task;assert.equal(w.stores.has('ensam-old'),false);assert.equal(w.stores.has('other-app'),true);assert.equal(w.calls.claim,1);
});
