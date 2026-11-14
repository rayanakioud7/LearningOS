// Optional real-browser integration gate. Uses a fresh browser context and ephemeral origin.
// Install Playwright separately, or set PLAYWRIGHT_MODULE to its index.mjs path.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createLearningServer} from '../server.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=createLearningServer();
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
let browser;
try{
 browser=await chromium.launch({headless:true,chromiumSandbox:true,...(process.env.PLAYWRIGHT_CHROMIUM?{executablePath:process.env.PLAYWRIGHT_CHROMIUM}:{})});
 const context=await browser.newContext({acceptDownloads:true,timezoneId:'Africa/Casablanca',viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const legacy=JSON.parse(readFileSync(new URL('../test/fixtures/legacy-v1.json',import.meta.url)));
 legacy.events.push({id:'prior-completion',type:'session',taskId:'ila-311',day:'2026-11-16',minutes:35,outcome:'completed'});
 legacy.timer={id:'prior-timer',taskId:'ila-311-examples',running:false,startedAt:Date.now(),accumulatedMs:2000,targetMinutes:25};
 await page.goto(origin+'/health');
 await page.evaluate(async state=>{await new Promise((resolve,reject)=>{const r=indexedDB.open('ensam-learning-os',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite'),store=tx.objectStore('state');store.put(state,'main');store.put({state,savedAt:'pre-existing'},'restore-point');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};});},legacy);
 await page.goto(origin+'/');await page.getByRole('button',{name:'Resume',exact:true}).waitFor();
 const saved=key=>page.evaluate(async key=>{const {openDatabase,readSaved}=await import('./storage.js');const db=await openDatabase();try{return await readSaved(db,key||'main');}finally{db.close();}},key);
 const migrated=await saved();assert.equal(migrated.schema,2);assert.deepEqual(migrated.events,legacy.events);assert.deepEqual(migrated.timer,legacy.timer);assert.deepEqual((await saved('migration-v1')).state,legacy);assert.equal((await saved('restore-point')).savedAt,'pre-existing');
 await page.getByRole('button',{name:'Resume',exact:true}).click();await page.reload();await page.getByRole('button',{name:'Pause',exact:true}).waitFor();assert.equal((await saved()).timer.running,true);
 await page.getByRole('button',{name:'Settings',exact:true}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup',exact:true}).click();const download=await downloadPromise,backupPath=await download.path(),backup=JSON.parse(readFileSync(backupPath));assert.equal(backup.timer.running,false);assert.equal(backup.events[0].id,'prior-completion');
 await page.getByRole('button',{name:'Today',exact:true}).click();await page.getByRole('button',{name:'Partial',exact:true}).click();await page.getByRole('button',{name:'Save session',exact:true}).click();assert.equal((await saved()).events.length,2);
 await page.getByRole('button',{name:'Settings',exact:true}).click();const chooserPromise=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Restore backup',exact:true}).click();await (await chooserPromise).setFiles(backupPath);await page.getByRole('button',{name:'Restore',exact:true}).click();assert.equal((await saved()).events.length,1);assert.equal((await saved()).timer.running,false);assert.equal((await saved('restore-point')).state.events.length,2);
 await page.getByRole('button',{name:'Today',exact:true}).click();await page.getByRole('button',{name:'Skipped',exact:true}).click();await page.getByRole('button',{name:'Save session',exact:true}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'Recover previous plan',exact:true}).click();await page.getByRole('button',{name:'Recover previous plan',exact:true}).last().click();assert.equal((await saved()).events.length,2);assert.equal((await saved()).timer,null);
 await page.getByRole('button',{name:'Curriculum',exact:true}).click();await page.getByRole('button',{name:'Review catalog import',exact:true}).click();await page.getByRole('button',{name:'Clear selection',exact:true}).click();await page.locator('input[name=unit][value="velleman:3-4"]').check();await page.locator('input[name=reviewed]').check();await page.getByRole('button',{name:'Import selected units',exact:true}).click();assert.equal((await saved()).tasks.find(t=>t.id==='catalog:velleman:3-4').status,'draft');
 await page.getByRole('button',{name:'Calendar',exact:true}).click();await page.getByRole('button',{name:'3-Year',exact:true}).click();assert.match(await page.locator('body').textContent(),/NOT ACTIVATED/);assert.equal((await saved()).events.length,2);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No phone-width overflow');await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle!=='none'),'Keyboard focus visible');
 // Native IndexedDB reopens and backup state remain intact while the app shell is offline.
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 const beforeOffline=await saved();await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Today',exact:true}).waitFor();assert.deepEqual((await saved()).events,beforeOffline.events);
 assert.deepEqual(errors,[]);console.log('PASS: native IndexedDB migration, recovery snapshots, timer reload, manual export/restore, catalog staging, 3-Year view, phone overflow, keyboard focus and offline reload.');
 await context.close();
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
