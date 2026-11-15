import {readFileSync,existsSync} from 'node:fs';
import {validateBackup} from '../dist/validation.js';
import {migrateState,previewImport} from '../dist/curriculum.js';
import {synchronizeCurriculum} from '../dist/automatic-curriculum.js';
import {project} from '../dist/planner.js';
import assert from 'node:assert/strict';
const read=name=>JSON.parse(readFileSync(new URL('../dist/'+name,import.meta.url)));
const seed=read('seed.json'),catalog=read('catalog.json'),planning=read('planning.json');
validateBackup(seed);const s=synchronizeCurriculum(migrateState(seed,catalog,planning),catalog);validateBackup(s);const preview=previewImport(s,catalog);
assert.ok(s.tasks.every(t=>t.status==='active'&&t.reviewed));assert.equal(s.events.length,seed.events.length);
assert.equal(catalog.units.length,383);assert.ok(catalog.units.some(u=>u.id==='ensam:recherche-operationnelle'));assert.ok(catalog.units.some(u=>u.id==='dsa:ch-7'));assert.equal(catalog.archiveRegistry.length,286);assert.equal(s.semesters.length,6);
const publicData=JSON.stringify({seed,catalog,planning});for(const marker of ['internalPath','sourceLocator','.rar','/home/','C:\\','Cybersécurité'])assert.ok(!publicData.includes(marker),'Private marker in public data: '+marker);
const before=JSON.stringify(s),rows=project(s,'2026-11-14','2029-06-30',catalog);assert.equal(rows.length,960);assert.equal(JSON.stringify(s),before);
for(const sem of s.semesters.filter(s=>s.id<6))assert.ok(rows.some(p=>p.semester===sem.id&&(p.task||p.unit)),'Missing scenario allocations in semester '+sem.id);
assert.ok(rows.filter(p=>p.semester===6).every(p=>(p.blocks||[]).every(b=>b.task.track==='academic')),'PFE must remain protected from independent study allocations');
assert.ok(rows.flatMap(p=>p.blocks||[]).every(b=>!b.task.referenceOnly),'Module overviews and historical files are references, not invented teacher assignments');
const sw=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');for(const [,name] of sw.matchAll(/'\.\/([^']+)'/g))assert.ok(existsSync(new URL('../dist/'+name,import.meta.url)),'Missing offline asset '+name);
console.log(`PASS: seed/schema migration; ${catalog.units.length} sanitized public units (${preview.counts.duplicate} existing equivalents); ${catalog.archiveRegistry.length} opaque archive references; six semester scenarios; 960 nonmutating civil dates; offline asset manifest.`);

