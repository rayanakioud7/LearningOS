// Optional real-browser integration gate. Uses a fresh browser context and ephemeral origin.
// Install Playwright separately, or set PLAYWRIGHT_MODULE to its index.mjs path.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const overallTimeout=setTimeout(()=>{console.error('Browser acceptance exceeded 10 minutes.');process.exit(1);},600000);overallTimeout.unref();
import {createLearningServer} from '../server.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const server=createLearningServer();
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
let browser;
try{
 browser=await chromium.launch({headless:true,chromiumSandbox:true,...(process.env.PLAYWRIGHT_CHROMIUM?{executablePath:process.env.PLAYWRIGHT_CHROMIUM}:{})});
 const context=await browser.newContext({acceptDownloads:true,timezoneId:'Africa/Casablanca',viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];
 await page.clock.install({time:new Date('2026-11-16T09:00:00Z')});
 page.on('pageerror',e=>errors.push(e.message));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const legacy=JSON.parse(readFileSync(new URL('../test/fixtures/legacy-v1.json',import.meta.url)));
 legacy.events.push({id:'prior-completion',type:'session',taskId:'ila-311',day:'2026-11-16',minutes:35,outcome:'completed'});
 legacy.timer={id:'prior-timer',taskId:'ila-311-examples',running:false,startedAt:Date.now(),accumulatedMs:2000,targetMinutes:25};
 await page.goto(origin+'/health');
 await page.evaluate(async state=>{await new Promise((resolve,reject)=>{const r=indexedDB.open('ensam-learning-os',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('state','readwrite'),store=tx.objectStore('state');store.put(state,'main');store.put({state,savedAt:'pre-existing'},'restore-point');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};});},legacy);
 await page.goto(origin+'/#today');await page.getByRole('button',{name:'Resume',exact:true}).waitFor();
 const saved=key=>page.evaluate(async key=>{const {openDatabase,readSaved}=await import('./storage.js');const db=await openDatabase();try{return await readSaved(db,key||'main');}finally{db.close();}},key);
 const migrated=await saved();assert.equal(migrated.schema,2);assert.deepEqual(migrated.events,legacy.events);assert.deepEqual(migrated.timer,legacy.timer);assert.deepEqual((await saved('migration-v1')).state,legacy);assert.equal((await saved('restore-point')).savedAt,'pre-existing');
 await page.getByRole('button',{name:'Resume',exact:true}).click();await page.getByRole('button',{name:'Pause',exact:true}).waitFor();await page.reload();await page.getByRole('button',{name:'Pause',exact:true}).waitFor();assert.equal((await saved()).timer.running,true);
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('input[name=focusMinutes]').click();assert.equal(await page.locator('input[name=focusMinutes]').evaluate(el=>el===document.activeElement),true,'Clicking a preference must not redraw the whole page');const availabilitySummary=page.locator('.settings-section > summary').filter({hasText:'Exams & availability'});await availabilitySummary.click();assert.equal(await availabilitySummary.evaluate(el=>el.parentElement.open),true,'A settings disclosure must stay open after its click');await availabilitySummary.click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup',exact:true}).click();const download=await downloadPromise,backupPath=await download.path(),backup=JSON.parse(readFileSync(backupPath));assert.equal(backup.timer.running,false);assert.equal(backup.events[0].id,'prior-completion');
 await page.getByRole('button',{name:'Today',exact:true}).click();await page.getByRole('button',{name:'Partial',exact:true}).click();await page.getByRole('button',{name:'Save session',exact:true}).click();await page.locator('#modal').waitFor({state:'hidden'});assert.equal((await saved()).events.length,2);
 await page.getByRole('button',{name:'Settings',exact:true}).click();const chooserPromise=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Restore backup',exact:true}).click();await (await chooserPromise).setFiles(backupPath);await page.getByRole('button',{name:'Restore',exact:true}).click();await page.locator('#modal').waitFor({state:'hidden'});assert.equal((await saved()).events.length,1);assert.equal((await saved()).timer.running,false);assert.equal((await saved('restore-point')).state.events.length,2);
 await page.getByRole('button',{name:'Today',exact:true}).click();await page.getByRole('button',{name:'Skipped',exact:true}).click();await page.getByRole('button',{name:'Save session',exact:true}).click();await page.locator('#modal').waitFor({state:'hidden'});await page.getByRole('button',{name:'Settings',exact:true}).click();await page.locator('.settings-section > summary').filter({hasText:'Backup recovery & reconciliation'}).click();await page.getByRole('button',{name:'Recover previous plan',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Recover previous plan',exact:true}).click();await page.locator('#modal').waitFor({state:'hidden'});assert.equal((await saved()).events.length,2);assert.equal((await saved()).timer,null);console.log('PASS: migration, timer reload, paused export, restore and recovery.');
 await page.getByRole('button',{name:'Curriculum',exact:true}).click();await page.getByText('Add from catalog',{exact:true}).click();await page.getByRole('button',{name:'Review catalog import',exact:true}).click();await page.getByRole('button',{name:'Clear selection',exact:true}).click();await page.locator('input[name=unit][value="velleman:3-4"]').check();await page.locator('input[name=reviewed]').check();await page.getByRole('button',{name:'Import selected units',exact:true}).click();await page.locator('#modal').waitFor({state:'hidden'});assert.equal((await saved()).tasks.find(t=>t.id==='catalog:velleman:3-4').status,'draft');
 await page.getByRole('button',{name:'Calendar',exact:true}).click();await page.getByLabel('More calendar views',{exact:true}).selectOption('3-Year');assert.match(await page.locator('body').textContent(),/NOT ACTIVATED/);assert.equal((await saved()).events.length,2);
 // Date input is committed by Go/Enter, so typing does not replace the native control mid-edit.
 await page.getByRole('button',{name:'Month',exact:true}).click();
 for(const date of ['2026-10-15','2028-10-03','2029-06-20']){
  await page.getByLabel('Calendar start',{exact:true}).fill(date);
  await page.getByRole('button',{name:'Go',exact:true}).click();
  assert.equal(await page.getByLabel('Calendar start',{exact:true}).inputValue(),date);
  assert.ok(await page.locator('.calendar-detail').textContent());
 }
 await page.getByRole('button',{name:'Week',exact:true}).click();assert.equal(await page.getByLabel('Calendar start',{exact:true}).inputValue(),'2029-06-20');
 await page.getByLabel('Calendar start',{exact:true}).fill('2030-01-01');await page.getByRole('button',{name:'Go',exact:true}).click();
 assert.equal(await page.getByLabel('Calendar start',{exact:true}).evaluate(el=>el.validity.rangeOverflow),true);
 await page.getByLabel('Calendar start',{exact:true}).fill('2028-10-03');await page.getByLabel('Calendar start',{exact:true}).press('Enter');
 await page.getByLabel('More calendar views',{exact:true}).selectOption('Year');assert.equal(await page.locator('.compact-month').count(),12);
 await page.locator('[data-calendar-month="2028-10-01"]').click();await page.locator('[data-calendar-date="2028-10-03"]').click();assert.equal(await page.getByLabel('Calendar start',{exact:true}).inputValue(),'2028-10-03');
 assert.match(await page.locator('.calendar-detail').textContent(),/PROVISIONAL/);
 await page.getByRole('button',{name:'Curriculum',exact:true}).click();await page.getByRole('tab',{name:'S3',exact:true}).click();
 assert.equal(await page.getByRole('tab',{name:'S3',exact:true}).getAttribute('aria-selected'),'true');
 await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('tab',{name:'S4',exact:true}).getAttribute('aria-selected'),'true');
 await page.getByRole('button',{name:'Calendar',exact:true}).click();await page.getByRole('button',{name:'Month',exact:true}).click();
 await page.getByLabel('Calendar start',{exact:true}).fill('2028-10-03');await page.getByRole('button',{name:'Go',exact:true}).click();const calendarURL=page.url();
 await page.getByRole('button',{name:'Curriculum',exact:true}).click();await page.goBack();assert.equal(page.url(),calendarURL);assert.equal(await page.getByLabel('Calendar start',{exact:true}).inputValue(),'2028-10-03');
 await page.reload();assert.equal(await page.getByLabel('Calendar start',{exact:true}).inputValue(),'2028-10-03');
 await page.locator('.calendar-cell[data-calendar-date="2028-10-03"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.getByLabel('Calendar start',{exact:true}).inputValue(),'2028-10-04');
 // A synthetic 120/75/200 task exercises the actual form, not only the model helper.
 await page.evaluate(async()=>{
  const {openDatabase,readSaved,saveChange}=await import('./storage.js');const {addLocalTask}=await import('./curriculum.js');const {recordOutcome}=await import('./engine.js');
  const db=await openDatabase(),s=await readSaved(db);
  await saveChange(db,s.revision,state=>{
   let next=addLocalTask(state,{...state.tasks[0],id:'browser-networks',resource:'Synthetic networks',heading:'Synthetic networks exercise',title:'Synthetic networks exercise',minutes:120,initialEstimateMinutes:120,remainingMinutes:200,track:'academic',deadline:'2026-11-15',notBefore:'',prerequisites:[],status:'active'});
   for(let i=0;i<3;i++)next=recordOutcome(next,{id:'browser-part-'+i,taskId:'browser-networks',day:'2026-11-16',outcome:'partial',minutes:25,remainingMinutes:200,note:'Synthetic attempt '+i});return next;
  });db.close();
 });
 await page.reload();await page.getByRole('button',{name:'Curriculum',exact:true}).click();
 await page.locator('.resource-card').filter({hasText:'Synthetic networks'}).getByRole('button',{name:'View contents →',exact:true}).click();
 await page.locator('[data-edit="browser-networks"]').click();await page.locator('input[name=heading]').fill('Edited synthetic heading');await page.getByRole('button',{name:'Save task',exact:true}).click();await page.locator('#modal').waitFor({state:'hidden'});
 assert.equal((await saved()).tasks.find(t=>t.id==='browser-networks').remainingMinutes,200);assert.equal((await saved()).events.filter(e=>e.taskId==='browser-networks').length,3);
 await page.getByRole('button',{name:'Study log',exact:true}).click();assert.match(await page.locator('body').textContent(),/3 retained attempts · 75 active min/);
 await page.locator('.log-group').filter({hasText:'Synthetic networks'}).locator('summary').click();assert.match(await page.locator('body').textContent(),/Synthetic attempt 2/);
 await page.getByRole('button',{name:'Calendar',exact:true}).click();await page.getByRole('button',{name:'Month',exact:true}).click();
 await page.getByRole('button',{name:'Study log',exact:true}).click();await page.getByLabel('Find an attempt',{exact:true}).fill('Synthetic attempt 2');assert.match(await page.locator('body').textContent(),/Synthetic networks/);
 await page.getByRole('button',{name:'Clear filters',exact:true}).click();
 await page.getByRole('button',{name:'Calendar',exact:true}).click();
 console.log('PASS: catalog, calendar routes, keyboard navigation, saved edits and study-log search.');
 // The learner's roadmap keeps its blocks even when no ready source task is staged.
 const beforeRoadmapEvents=(await saved()).events;
 const visitDay=async day=>{await page.getByRole('button',{name:'Day',exact:true}).click();await page.getByLabel('Calendar start',{exact:true}).fill(day);await page.getByRole('button',{name:'Go',exact:true}).click();};
 const saveRoadmapChoices=async()=>{const before=await page.locator('main').getAttribute('data-revision');await page.getByRole('button',{name:'Save roadmap choices',exact:true}).click();await page.waitForFunction(before=>document.querySelector('main')?.dataset.revision!==before,before);};
 const openChoices=async()=>{const details=page.locator('.roadmap-controls');if(!await details.evaluate(el=>el.open))await details.locator('summary').click();};
 await visitDay('2026-11-26');assert.match(await page.locator('.roadmap-day').textContent(),/Even ISO weeks/);
 await visitDay('2027-03-04');assert.match(await page.locator('.roadmap-block').textContent(),/VanderPlas/);assert.ok(!(await page.locator('.roadmap-block').textContent()).includes('Stat 110'));
 await visitDay('2027-07-05');await openChoices();await page.locator('input[name=summer1Enabled]').check();await saveRoadmapChoices();assert.equal((await saved()).settings.roadmapChoices.summer1Enabled,true);
 await visitDay('2027-09-08');assert.match(await page.locator('.roadmap-day').textContent(),/Wasserman/);assert.match(await page.locator('.roadmap-day').textContent(),/60–90 min shared/);
 await visitDay('2028-02-03');assert.match(await page.locator('.roadmap-block').textContent(),/Prince synthesis/);await openChoices();await page.locator('select[name=daySupport]').selectOption('gpu');await saveRoadmapChoices();assert.match(await page.locator('.roadmap-block h3').textContent(),/GPU MODE/);
 await visitDay('2028-02-10');await openChoices();assert.equal(await page.locator('select[name=daySupport] option[value=gpu]').evaluate(option=>option.disabled),true);
 await visitDay('2028-10-07');await openChoices();await page.locator('select[name=capstoneBranch]').selectOption('B');await saveRoadmapChoices();assert.equal((await saved()).settings.roadmapChoices.capstoneBranch,'B');assert.deepEqual((await saved()).events,beforeRoadmapEvents);
 await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No phone-width overflow');await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle!=='none'),'Keyboard focus visible');
 // Native IndexedDB reopens and backup state remain intact while the app shell is offline.
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
 const beforeOffline=await saved();await page.getByRole('button',{name:'Today',exact:true}).click();await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'Today',exact:true}).waitFor();assert.deepEqual((await saved()).events,beforeOffline.events);
 assert.deepEqual(errors,[]);console.log('PASS: native IndexedDB migration/recovery, timer reload, backup restore, curriculum staging, calendar deep links and keyboard navigation, roadmap controls, mobile layout and offline reload.');
 await context.close();
 // Optional real backup is read only as an isolated private test input. It is never copied to dist.
 if(process.env.LEARNINGOS_TEST_BACKUP){
  const raw=JSON.parse(readFileSync(process.env.LEARNINGOS_TEST_BACKUP)),isolated=await browser.newContext(),p=await isolated.newPage();
  try{
   await p.goto(origin+'/health');
   const result=await p.evaluate(async raw=>{
    const {openDatabase,saveChange,readSaved,migrateDatabase}=await import('./storage.js');const {prepareRestore,prepareTransfer}=await import('./backup.js');const {validateBackup}=await import('./validation.js');
    validateBackup(raw);const db=await openDatabase();const [catalog,planning]=await Promise.all(['./catalog.json','./planning.json'].map(u=>fetch(u).then(r=>r.json())));
    const source=prepareRestore(raw,0);await saveChange(db,0,s=>s,source);await migrateDatabase(db,catalog,planning);
    const saved=await readSaved(db),roundTrip=prepareRestore(JSON.parse(JSON.stringify(prepareTransfer(saved))),saved.revision);await saveChange(db,saved.revision,()=>roundTrip,null,{preservePrevious:true});
    const final=await readSaved(db),previous=await readSaved(db,'restore-point');db.close();
    return {events:final.events,tasks:final.tasks.length,recoveryEvents:previous.state.events};
   },raw);
   assert.deepEqual(result.events,raw.events);assert.deepEqual(result.recoveryEvents,raw.events);assert.equal(result.tasks,raw.tasks.length);
   console.log('PASS: isolated supplied-backup native IndexedDB roundtrip and recovery; no events lost.');
  }finally{await isolated.close();}
 }
}finally{if(browser)await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));clearTimeout(overallTimeout);}
