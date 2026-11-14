import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createLearningServer} from '../server.mjs';
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url)));
async function withServer(run){
  const server=createLearningServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{await run(`http://127.0.0.1:${server.address().port}`);}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
test('launcher health endpoint identifies the real project and version without caching',()=>withServer(async url=>{
  const r=await fetch(url+'/health'),body=await r.json();assert.equal(r.status,200);assert.equal(body.app,'LearningOS');assert.equal(body.version,pkg.version);assert.equal(body.projectRoot.toLowerCase(),fileURLToPath(new URL('..',import.meta.url)).replace(/[\\/]$/,'').toLowerCase());assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(body.pid,process.pid);
}));
test('asset responses identify the current build and force online revalidation',()=>withServer(async url=>{
  const r=await fetch(url+'/style.css',{method:'HEAD'});assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/css/);assert.equal(r.headers.get('x-learningos-version'),pkg.version);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(await r.text(),'');
}));
test('static server rejects unsupported methods and missing assets',()=>withServer(async url=>{
  assert.equal((await fetch(url+'/health',{method:'POST'})).status,405);assert.equal((await fetch(url+'/missing-resource.js')).status,404);
}));
