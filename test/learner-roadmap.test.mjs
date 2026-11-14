import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IDBFactory} from 'fake-indexeddb';
import {migrateState,addLocalTask,applyImport,previewImport} from '../dist/curriculum.js';
import {recordOutcome,dailyChoice,completed,forecast} from '../dist/engine.js';
import {project,ruleV2,pinToday} from '../dist/planner.js';
import {roadmapDay,blockPlan,phaseFor,isoWeek,choicesFor,applyPlanningUpdate,updateRoadmapChoices,taskFitsBlock,weeklyCeiling} from '../dist/roadmap.js';
import {renderCalendarView} from '../dist/calendar-view.js';
import {renderRoadmapControls} from '../dist/roadmap-view.js';
import {validateBackup} from '../dist/validation.js';
import {prepareRestore,prepareTransfer} from '../dist/backup.js';
import {openDatabase,saveChange,readSaved,refreshPlanningDatabase} from '../dist/storage.js';
const read=n=>JSON.parse(readFileSync(new URL('../dist/'+n,import.meta.url)));
const catalog=read('catalog.json'),planning=read('planning.json');
const seed=()=>migrateState(read('seed.json'),catalog,planning,'2026-11-14T00:00:00Z');
function add(s,id,resourceId,extra={}){return addLocalTask(s,{...s.tasks[0],id,resource:s.resources.find(r=>r.id===resourceId).name,title:id,heading:id,section:'Practice',action:'Test this result.',evidence:'Checked result.',minutes:120,minimumMinutes:25,semester:phaseFor(s,extra.day||'2026-11-14')?.semester||1,notBefore:'',deadline:'',prerequisites:[],status:'active',track:resourceId==='ensam'?'academic':'independent',...extra});}
function staged(){let s=seed();s=applyImport(s,catalog,previewImport(s,catalog).rows.filter(r=>r.kind==='add').map(r=>r.unit.id));return s;}
function withChoices(s,patch){return updateRoadmapChoices(s,patch,'2026-11-14T00:00Z');}
test('phase windows follow the learner roadmap while academic February dates remain intact',()=>{
 const s=seed();assert.equal(phaseFor(s,'2026-11-14').id,'S1');assert.equal(phaseFor(s,'2027-01-20').id,'Winter');assert.equal(phaseFor(s,'2027-02-28').id,'Winter');assert.equal(phaseFor(s,'2027-03-01').id,'S2');assert.equal(phaseFor(s,'2027-06-30').id,'S2');assert.equal(phaseFor(s,'2027-07-01').id,'Summer1');assert.equal(s.semesters.find(x=>x.id===2).start,'2027-02-01');
});
test('ISO odd/even Thursdays and Sunday recovery apply to live choice and forecasts',()=>{
 let s=seed();assert.equal(isoWeek('2026-11-19'),47);assert.equal(isoWeek('2026-11-26'),48);assert.deepEqual(blockPlan(s,'2026-11-19')[0].resources,['velleman']);assert.equal(ruleV2(s,'2026-11-26').kind,'academic');
 s=add(s,'proof','velleman',{section:'Chapter 3.4'});s=add(s,'td','ensam');assert.equal(dailyChoice(s,'2026-11-19').task.id,'proof');assert.equal(dailyChoice(s,'2026-11-26').task.id,'td');assert.equal(project(s,'2026-11-26','2026-11-26')[0].task.id,'td');assert.equal(dailyChoice(s,'2026-11-22').task,null);
});
test('MIT double-integrals trial pauses after two Tuesdays until explicitly continued',()=>{
 let s=seed();assert.equal(dailyChoice(s,'2026-11-17').task.resourceId,'mit1802');assert.equal(dailyChoice(s,'2026-11-24').task.resourceId,'mit1802');assert.equal(dailyChoice(s,'2026-12-01').task,null);
 s=withChoices(s,{mitTrialContinues:true});assert.equal(dailyChoice(s,'2026-12-01').task.resourceId,'mit1802');
 const b=blockPlan(s,'2026-12-01')[0];assert.equal(taskFitsBlock(s,{resourceId:'mit1802',track:'independent',section:'Session 74'},b,'2026-12-01'),false);
});
test('Goodrich fallback needs an explicit empty ENSAM day and yields to actual coursework and exams',()=>{
 let s=add(seed(),'dsa','dsa',{section:'Chapter 7'});assert.equal(dailyChoice(s,'2026-11-18').task,null);s=withChoices(s,{noEnsamDays:['2026-11-18']});assert.equal(dailyChoice(s,'2026-11-18').task.id,'dsa');s=add(s,'td','ensam');assert.equal(dailyChoice(s,'2026-11-18').task.id,'td');s.settings.examMode='on';assert.equal(ruleV2(s,'2026-11-18').independentMinutes,0);
});
test('S2 maps probability to Tuesday and only VanderPlas practice to Thursday',()=>{
 const s=seed();assert.deepEqual(blockPlan(s,'2027-03-02')[0].resources,['stat110']);assert.equal(blockPlan(s,'2027-03-02')[0].maxUnits,3);assert.deepEqual(blockPlan(s,'2027-03-04')[0].resources,['vanderplas-2e','vanderplas']);assert.equal(blockPlan(s,'2027-03-04').length,1);assert.match(blockPlan(s,'2027-03-04')[0].description,/probability simulation/);assert.match(blockPlan(s,'2027-03-11')[0].description,/arrays, broadcasting/);
});
test('SVD and PCA require demonstrated foundations and SVD, respectively',()=>{
 let s=add(seed(),'svd-practice','svd',{semester:2});s=withChoices(s,{daySupports:{'2027-03-01':'svd'}});assert.notEqual(dailyChoice(s,'2027-03-01').task?.id,'svd-practice');s=withChoices(s,{gates:{'linear-foundations':true}});assert.equal(dailyChoice(s,'2027-03-01').task.id,'svd-practice');
 s=add(s,'pca','builder',{semester:2,heading:'PCA comparison'});assert.notEqual(dailyChoice(s,'2027-03-06').task?.id,'pca');s=withChoices(s,{gates:{...choicesFor(s).gates,svd:true}});assert.equal(dailyChoice(s,'2027-03-06').task.id,'pca');assert.equal(completed(s).size,0);
});
test('Summer 1 remains optional, with correct career/craft/polish roles and a separate summer ceiling',()=>{
 let s=seed();assert.equal(ruleV2(s,'2027-07-05').independentMinutes,0);assert.match(renderCalendarView(s,'2026-11-14','Day',catalog,'2027-07-07'),/Internships, CV, portfolio and applications/);
 s=withChoices(s,{summer1Enabled:true});assert.equal(ruleV2(s,'2027-07-05').independentMinutes,120);assert.equal(ruleV2(s,'2027-07-10').independentMinutes,240);assert.equal(weeklyCeiling(s,'2027-07-05'),780);assert.deepEqual(blockPlan(s,'2027-07-07')[0].resources,['career']);assert.ok(!blockPlan(s,'2027-07-08')[0].resources.includes('udl'));s.settings.weeklyMinutes=300;assert.equal(weeklyCeiling(s,'2027-07-05'),300);
});
test('S3 math clinic is contextual and excludes out-of-scope CS229/MML chapters',()=>{
 let s=seed();s=add(s,'lecture10','cs229',{section:'Lecture 10',semester:3});s=add(s,'lecture3','cs229',{section:'Lecture 3',semester:3});assert.equal(dailyChoice(s,'2027-09-06').task,null);s=withChoices(s,{geronTopic:'Why does the model need regularization?',mathClinicUnitId:'local:lecture3'});assert.equal(dailyChoice(s,'2027-09-06').task.id,'lecture3');const b=blockPlan(s,'2027-09-06')[0];assert.equal(taskFitsBlock(withChoices(s,{mathClinicUnitId:'ref16'}),{id:'ref16',resourceId:'cs229',track:'independent',section:'Lecture 16'},b,'2027-09-06'),false);assert.equal(taskFitsBlock(withChoices(s,{mathClinicUnitId:'ref16'}),{id:'ref16',resourceId:'cs229',track:'independent',section:'Lecture 16 · first half'},b,'2027-09-06'),true);
});
test('S3 Tuesday includes Géron Chapters 9–11 even when an old task was staged for S4',()=>{
 let s=add(seed(),'geron10','geron',{section:'Chapter 10',semester:4});assert.equal(dailyChoice(s,'2027-09-07').task.id,'geron10');s=add(s,'geron12','geron',{section:'Chapter 12',semester:3,priority:'P0'});assert.equal(dailyChoice(s,'2027-09-07').task.id,'geron10');
});
test('Wednesday shares one 60–90min budget between Wasserman 6–10 and ENSAM',()=>{
 let s=add(seed(),'inference','wasserman',{section:'Chapter 6',semester:3});s=add(s,'td','ensam',{semester:3});
 const row=project(s,'2027-09-08','2027-09-08')[0];assert.deepEqual(row.blocks.map(b=>b.task.id),['inference','td']);assert.deepEqual(row.blocks.map(b=>b.minutes),[45,45]);assert.equal(row.minutes,90);assert.equal(dailyChoice(s,'2027-09-08').task.id,'inference');
 s=recordOutcome(s,{id:'partial',taskId:'inference',day:'2027-09-08',minutes:45,outcome:'partial',remainingMinutes:200});assert.equal(dailyChoice(s,'2027-09-08').task.id,'td');assert.ok(project(s,'2027-09-08','2027-09-08')[0].minutes<=45);assert.equal(completed(s).size,0);
});
test('S4 Thursday is Prince synthesis; optional GPU replaces it at most once per month',()=>{
 let s=seed();assert.deepEqual(blockPlan(s,'2028-02-03')[0].resources,['udl']);s=withChoices(s,{daySupports:{'2028-02-03':'gpu','2028-02-10':'gpu'}});assert.deepEqual(blockPlan(s,'2028-02-10')[0].resources,['udl']);assert.match(blockPlan(s,'2028-02-10')[0].supportNotice,/already has/);
 s=withChoices(s,{daySupports:{'2028-02-03':'gpu'}});assert.deepEqual(blockPlan(s,'2028-02-03')[0].resources,['gpu-mode']);assert.equal(blockPlan(s,'2028-02-03').length,1);assert.equal(blockPlan(s,'2028-02-03')[0].minutes,60);
});
test('S3 micrograd is gated by evaluation and never creates an extra Saturday block',()=>{
 let s=withChoices(seed(),{daySupports:{'2027-09-11':'micrograd'}});assert.deepEqual(blockPlan(s,'2027-09-11')[0].resources,['builder']);s=withChoices(s,{gates:{'ml-evaluation':true}});assert.deepEqual(blockPlan(s,'2027-09-11')[0].resources,['karpathy']);assert.equal(blockPlan(s,'2027-09-11').length,1);
});
test('Summer 2 keeps one paper reproduction and MiniTorch release rather than unrelated courses',()=>{
 const s=seed();for(const day of ['2028-07-03','2028-07-04'])assert.deepEqual(blockPlan(s,day)[0].resources,['builder']);for(const day of ['2028-07-05','2028-07-06'])assert.deepEqual(blockPlan(s,day)[0].resources,['paper']);assert.equal(blockPlan(s,'2028-07-08')[0].scope,'summer2-release');
});
test('S5 scopes Raschka to 2–5, gates later UDL and enforces one capstone branch',()=>{
 let s=seed(),b=blockPlan(s,'2028-09-05')[0];for(const n of [1,6,7])assert.equal(taskFitsBlock(s,{resourceId:'raschka',track:'independent',section:'Chapter '+n},b,'2028-09-05'),false);
 b=blockPlan(s,'2028-09-04')[0];assert.equal(taskFitsBlock(s,{resourceId:'udl',track:'independent',section:'Chapter 13'},b,'2028-09-04'),false);
 assert.equal(blockPlan(s,'2028-09-09')[0].available,false);s=withChoices(s,{capstoneBranch:'B',capstoneTheoryNeeded:true});assert.equal(blockPlan(s,'2028-09-09')[0].available,true);assert.equal(taskFitsBlock(s,{resourceId:'udl',track:'independent',section:'Chapter 13'},b,'2028-09-04'),true);
});
test('S5 systems support requires baseline and branch need; kernel work additionally needs correctness and a bottleneck',()=>{
 let s=withChoices(seed(),{daySupports:{'2028-09-07':'cs336'}});assert.deepEqual(blockPlan(s,'2028-09-07')[0].resources,['tunstall']);s=withChoices(s,{gates:{'pretrained-baseline':true},capstoneBranch:'A',systemsSupportNeeded:true});assert.deepEqual(blockPlan(s,'2028-09-07')[0].resources,['cs336']);
 const b=blockPlan(s,'2028-09-09')[0],t={resourceId:'builder',track:'independent',semester:5,heading:'Kernel implementation',action:'Measure it.'};assert.equal(taskFitsBlock(s,t,b,'2028-09-09'),false);s=withChoices(s,{gates:{...choicesFor(s).gates,'cpu-correctness':true,'measured-bottleneck':true}});assert.equal(taskFitsBlock(s,t,b,'2028-09-09'),true);
});
test('every phase yields to exam peaks and retains university time with no catch-up debt',()=>{
 let s=withChoices(seed(),{summer1Enabled:true,capstoneBranch:'A',geronTopic:'Current derivation'});s.settings.examMode='on';
 for(const day of ['2026-11-16','2027-03-02','2027-07-05','2027-09-08','2028-02-03','2028-07-05','2028-10-03','2029-06-06']){assert.equal(ruleV2(s,day).independentMinutes,0);assert.ok(ruleV2(s,day).minutes>0);}
 assert.equal(ruleV2(s,'2026-11-15').minutes,0);const rows=project(s,'2026-11-14','2029-06-30',catalog);assert.ok(rows.every(r=>!r.blocks.some(b=>b.task.track==='independent')));assert.equal(completed(s).size,0);
});
test('policy update and choices preserve 120/75/200, checkpoints, private attachments and immutable events',async()=>{
 let s=add(seed(),'networks','ensam');for(let i=0;i<3;i++)s=recordOutcome(s,{id:'partial-'+i,taskId:'networks',day:'2026-11-14',minutes:25,outcome:'partial',remainingMinutes:200});
 s.attachments.push({id:'attachment',unitId:s.tasks.at(-1).unitId,name:'private.txt',data:'YWJj'});s.planning.policyVersion=2;const original=structuredClone(s),next=applyPlanningUpdate(s,planning,'2026-11-14');
 for(const key of ['tasks','events','checkpoints','attachments','calendar','settings'])assert.deepEqual(next[key],original[key]);assert.equal(next.tasks.at(-1).remainingMinutes,200);assert.equal(applyPlanningUpdate(next,planning),next);
 const changed=withChoices(next,{summer1Enabled:true,gates:{'linear-foundations':true}}),roundTrip=prepareRestore(JSON.parse(JSON.stringify(prepareTransfer(changed))),changed.revision);assert.deepEqual(roundTrip.events,original.events);
 const db=await openDatabase(new IDBFactory());try{let saved=await saveChange(db,s.revision,x=>x,s);saved=await saveChange(db,saved.revision,x=>x,null,{preservePrevious:true});const previous=await readSaved(db,'restore-point');saved=await refreshPlanningDatabase(db,planning);assert.deepEqual(await readSaved(db,'restore-point'),previous);assert.deepEqual((await readSaved(db,'planning-before-4')).state.events,original.events);assert.deepEqual(saved.events,original.events);}finally{db.close();}
});
test('960-day projection is pure and the calendar shows blocks, ranges, gates and safe links with no staged task',()=>{
 const s=seed(),before=structuredClone(s),rows=project(s,'2026-11-14','2029-06-30',catalog);assert.equal(rows.length,960);assert.ok(rows.every(r=>r.roadmap));assert.deepEqual(s,before);assert.equal(completed(s).size,0);
 const html=renderCalendarView(s,'2026-11-14','Day',catalog,'2028-02-03');assert.match(html,/Prince synthesis/);assert.match(html,/60–90 min/);assert.match(html,/Done when/);assert.match(html,/UDL routine/);assert.match(html,/Roadmap choices/);
 assert.match(renderCalendarView(s,'2026-11-14','Day',catalog,'2028-10-07'),/ROCm\/Triton\/HIP/);assert.match(renderRoadmapControls(s,'2028-09-09','2026-11-14'),/ONE capstone/);
});
test('invalid choices and branches are rejected before backup persistence',()=>{
 for(const roadmapChoices of [{capstoneBranch:['A','B']},{gates:{fake:true}},{daySupports:{'2028-02-03':'invented'}},{summer1Enabled:'yes'}]){const s=seed();s.settings.roadmapChoices=roadmapChoices;assert.throws(()=>validateBackup(s));}
});
test('numerical lab follows elimination → Monte Carlo → gradient → least squares → gated PCA; S1 does not add SQL',()=>{
 const ids=['builder:numerical-elimination','builder:numerical-monte-carlo','builder:numerical-gradient-checks','builder:numerical-least-squares','builder:pca-after-svd'];
 for(let i=0;i<ids.length;i++){const u=catalog.units.find(u=>u.id===ids[i]);assert.ok(u);assert.deepEqual(u.dependencies,i?[ids[i-1]]:[]);}
 const s=seed(),b=blockPlan(s,'2026-11-14')[0];assert.equal(taskFitsBlock(s,{resourceId:'builder',track:'independent',semester:1,heading:'Oracle SQL schema',action:'Queries'},b,'2026-11-14'),false);
 const html=renderRoadmapControls(s,'2027-09-06','2026-11-14',catalog);assert.ok(!html.includes('value="cs229:lecture-10"'));assert.ok(html.includes('value="cs229:lecture-16-first-half"'));
});
test('Missing Semester support stays inside Saturday and selects Git, not a new shell course',()=>{
 const s=withChoices(seed(),{daySupports:{'2026-11-14':'git'}}),b=blockPlan(s,'2026-11-14')[0];assert.equal(b.minutes,180);assert.equal(b.scope,'git');assert.equal(blockPlan(s,'2026-11-14').length,1);
 assert.equal(taskFitsBlock(s,{resourceId:'missing',track:'independent',heading:'Shell scripting',action:'Use a shell.'},b,'2026-11-14'),false);
 assert.equal(taskFitsBlock(s,{resourceId:'missing',track:'independent',heading:'Version control (Git)',action:'Resolve a merge.'},b,'2026-11-14'),true);
});
test('completing the last allowed Raschka chapter never pulls Chapter 6 into the same day',()=>{
 let s=add(seed(),'r5','raschka',{semester:5,section:'Chapter 5',minutes:30});s=add(s,'r6','raschka',{semester:5,section:'Chapter 6',minutes:30,prerequisites:['r5']});s=recordOutcome(s,{id:'r5-done',taskId:'r5',day:'2028-09-05',minutes:30,outcome:'completed'});assert.equal(s.pinnedDay,null);assert.equal(dailyChoice(s,'2028-09-05').task,null);assert.equal(completed(s).has('r6'),false);
});
test('two tabs refreshing the roadmap converge and keep the old recovery copy',async()=>{
 const db=await openDatabase(new IDBFactory());try{const s=seed();s.planning.policyVersion=2;let saved=await saveChange(db,s.revision,x=>x,s);saved=await saveChange(db,saved.revision,x=>x,null,{preservePrevious:true});const old=await readSaved(db,'restore-point');const [a,b]=await Promise.all([refreshPlanningDatabase(db,planning),refreshPlanningDatabase(db,planning)]);assert.deepEqual(a,b);assert.deepEqual(await readSaved(db,'restore-point'),old);assert.equal((await readSaved(db,'planning-before-4')).state.planning.policyVersion,2);}finally{db.close();}
});
