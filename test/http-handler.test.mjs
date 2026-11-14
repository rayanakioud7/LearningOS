import test from 'node:test';
import assert from 'node:assert/strict';
import {createLearningServer} from '../server.mjs';
function request(url,method='GET'){return new Promise((resolve,reject)=>{const server=createLearningServer(),res={writeHead(status,headers){this.status=status;this.headers=headers;},end(body){resolve({status:this.status,headers:this.headers,text:Buffer.isBuffer(body)?body.toString():body||''});}};server.emit('request',{url,method},res);});}
test('HTTP handler serves the v2 catalog and correct MIME/cache headers',async()=>{const r=await request('/catalog.json');assert.equal(r.status,200);assert.match(r.headers['Content-Type'],/application\/json/);assert.equal(r.headers['Cache-Control'],'no-store');assert.equal(JSON.parse(r.text).units.length,234);});
test('HTTP handler supports HEAD and exposes build health',async()=>{assert.equal((await request('/planner.js','HEAD')).text,'');const r=await request('/health');assert.equal(JSON.parse(r.text).version,'0.4.0');});
test('HTTP handler never serves private research directories or unsupported methods',async()=>{for(const url of ['/private/research/archive_inventory.json','/../private/research/curriculum_catalog.json','/%2e%2e%2fprivate/research/archive_inventory.json'])assert.notEqual((await request(url)).status,200);assert.equal((await request('/','POST')).status,405);});
