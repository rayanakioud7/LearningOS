import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderTodayView} from '../dist/today.js';
import {renderRestorePreview,transferSummary} from '../dist/transfer-view.js';
import {renderOutcomeForm} from '../dist/outcome-view.js';
const seed=()=>JSON.parse(readFileSync(new URL('../dist/seed.json',import.meta.url)));
const event=(id,extra={})=>({id,type:'session',taskId:'ila-311',day:'2026-11-16',at:'2026-11-16T10:00:00Z',outcome:'partial',minutes:10,...extra});

test('Sunday shows recovery and the next precise session, without a disabled clock or outcomes',()=>{
 const s=seed(),before=structuredClone(s),html=renderTodayView(s,'2026-11-15');
 assert.match(html,/Room to recharge/);assert.match(html,/Next planned session/);assert.match(html,/Matrices as Functions/);assert.match(html,/data-calendar-open="2026-11-15"/);assert.match(html,/data-calendar-open="2026-11-16"/);assert.ok(!html.includes('role="timer"'));assert.ok(!html.includes('data-outcome='));assert.deepEqual(s,before);
});
test('a paused session remains resumable even on a protected day',()=>{
 const s=seed();s.timer={taskId:'ila-311',targetMinutes:25,running:false};const html=renderTodayView(s,'2026-11-15');
 assert.match(html,/role="timer"/);assert.match(html,/>Resume<\/button>/);assert.match(html,/<h1>Matrices as Functions<\/h1>/);assert.ok(!html.includes('Room to recharge'));
});
test('exam protection without confirmed coursework does not display an independent-study countdown',()=>{
 const s=seed();s.settings.examMode='on';const html=renderTodayView(s,'2026-11-16');
 assert.match(html,/ENSAM comes first/);assert.match(html,/Add ENSAM task/);assert.ok(!html.includes('role="timer"'));assert.ok(!html.includes('data-outcome='));
});
test('backup preview counts only real attempts and preserves frozen task evidence',()=>{
 const s=seed(),before=structuredClone(s);assert.equal(transferSummary(s).sessions,0);
 s.events.push(event('late',{at:'2026-11-18T10:00:00Z',taskSnapshot:{resource:'Original source',section:'§2.7',heading:'Frozen heading'}}),event('early'));
 const summary=transferSummary(s);assert.equal(summary.sessions,2);assert.match(summary.latest.title,/Frozen heading/);assert.equal(summary.latest.day,'2026-11-16');assert.equal(summary.latest.status,'Partial progress');
 assert.deepEqual(before.events,[]);assert.equal(s.events.length,2);
});
test('corrected completion stays visibly corrected and equal-date legacy attempts retain append order',()=>{
 const s=seed();s.events=[event('first',{at:undefined,outcome:'completed'}),event('second',{at:undefined,outcome:'skipped'}),{id:'void',type:'void',target:'second'}];
 assert.equal(transferSummary(s).latest.status,'Corrected attempt');assert.equal(transferSummary(s).sessions,2);
});
test('restore comparison exposes older exports and escapes untrusted backup names and source headings',()=>{
 const current=seed(),incoming=seed();current.updatedAt='2026-11-18T12:00:00Z';incoming.exportedAt='2026-11-17T12:00:00Z';incoming.events=[event('incoming',{taskSnapshot:{resource:'<script>bad</script>',section:'§1',heading:'<img src=x>'},note:'PRIVATE-NOTE-NOT-FOR-PREVIEW'})];
 const html=renderRestorePreview(incoming,current,{fileName:'<b>backup.json</b>'});
 assert.match(html,/Incoming backup/);assert.match(html,/This browser/);assert.match(html,/before the last save/);assert.match(html,/&lt;b&gt;backup/);assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));assert.ok(!html.includes('PRIVATE-NOTE-NOT-FOR-PREVIEW'));
 assert.ok(!renderRestorePreview(seed(),seed()).includes('before the last save'));
});
test('remaining effort is enabled only for Partial, and completion exposes the actual milestone',()=>{
 const task=seed().tasks[0];const completed=renderOutcomeForm(task,{selectedOutcome:'completed'}),partial=renderOutcomeForm(task,{selectedOutcome:'partial'}),skipped=renderOutcomeForm(task,{selectedOutcome:'skipped'});
 assert.match(completed,/<section id="completion-evidence" class="completion-evidence" >/);assert.ok(completed.includes(task.evidence));assert.match(completed,/name="remaining"[^>]*disabled/);
 assert.ok(!/name="remaining"[^>]*disabled/.test(partial));assert.match(partial,/<section id="completion-evidence"[^>]*hidden/);assert.match(skipped,/name="remaining"[^>]*disabled/);
});
test('session review distinguishes no recorded time from a short real attempt',()=>{
 const task=seed().tasks[0];assert.match(renderOutcomeForm(task),/No focus time recorded/);assert.match(renderOutcomeForm(task,{activeMinutes:0.05}),/Less than a minute of focus/);assert.match(renderOutcomeForm(task,{activeMinutes:1}),/1 active minute recorded/);
});
