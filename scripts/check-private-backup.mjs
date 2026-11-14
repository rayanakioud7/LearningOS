// Read-only, isolated model regression. Never opens browser storage or writes the backup.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {validateBackup} from '../dist/validation.js';
import {migrateState,reviseTask} from '../dist/curriculum.js';
import {prepareTransfer,prepareRestore} from '../dist/backup.js';
import {project} from '../dist/planner.js';
import {effortFor} from '../dist/effort.js';
const path=process.argv[2];
if(!path)throw Error('Provide an absolute private backup path; no file is imported or written.');
const original=readFileSync(path,'utf8'),raw=validateBackup(JSON.parse(original));
const read=name=>JSON.parse(readFileSync(new URL('../dist/'+name,import.meta.url)));
const catalog=read('catalog.json'),state=migrateState(raw,catalog,read('planning.json'),'isolated-check');
assert.deepEqual(state.events,raw.events);assert.deepEqual(state.checkpoints,raw.checkpoints);assert.equal(state.tasks.length,raw.tasks.length);
const transfer=prepareTransfer(state),restored=prepareRestore(JSON.parse(JSON.stringify(transfer)),state.revision);
for(const key of ['events','tasks','units','resources','checkpoints','revisions','overrides','attachments'])assert.deepEqual(restored[key],JSON.parse(JSON.stringify(state[key])));
const tested=new Set();
for(const event of state.events.filter(e=>e.type==='session'&&e.outcome==='partial')){
 if(tested.has(event.taskId))continue;tested.add(event.taskId);
 const task=state.tasks.find(t=>t.id===event.taskId);if(state.timer?.taskId===task.id)continue;
 const edited=reviseTask(state,task.id,{heading:task.heading});assert.deepEqual(edited.events,state.events);
 assert.deepEqual(effortFor(edited,edited.tasks.find(t=>t.id===task.id)),effortFor(state,task));
}
const before=JSON.stringify(state),rows=project(state,'2026-11-14','2029-06-30',catalog);
assert.equal(rows.length,960);assert.equal(JSON.stringify(state),before);assert.equal(readFileSync(path,'utf8'),original);
console.log(`PASS: isolated schema ${raw.schema} backup; ${raw.tasks.length} tasks, ${raw.events.length} events retained; metadata/effort invariants; 960 pure projections. Native browser storage was not opened.`);
