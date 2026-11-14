import {correctEditions} from './catalog-editions.mjs';
import {ensamModules,extraResources,extraUnits,semesterOverrides,weeklyResources,weeklySecondary,weeklySlots,academicWindows,phases,weeklyBlocks} from './roadmap-overrides.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
const read=name=>JSON.parse(readFileSync(new URL('../private/research/'+name,import.meta.url)));
const catalog=read('curriculum_catalog.json'),inventory=read('archive_inventory.json'),rules=read('planning_rules.json');
// Explicit allowlist: private archive titles, locators, notes and bytes never enter dist.
const fields=['id','resourceId','semester','unitRef','heading','activity','completionEvidence','estimatedMinutes','priority','track','kind','link','dependencies','preferredDays','sourceProvenance','headingConfidence','branch'];
const baseUnits=catalog.units.filter(u=>!u.sourceLocator&&u.kind!=='academic_course_file').map(u=>({...Object.fromEntries(fields.map(k=>[k,u[k]])),...(u.resourceId==='builder'?{headingConfidence:'authored_milestone'}:{})}));
const units=[...baseUnits,...ensamModules,...extraUnits];
const ids=new Set(units.map(u=>u.id));
if(ids.size!==units.length)throw Error('Duplicate unit IDs in the public catalog');
if(units.some(u=>u.dependencies.some(id=>!ids.has(id))))throw Error('Sanitization left an orphan dependency');
const semesters=[
 {id:1,title:'Foundations',start:'2026-09-14',end:'2027-01-31',confidence:'verified_2026_27'},
 {id:2,title:'Probability & numerical computing',start:'2027-02-01',end:'2027-06-13',confidence:'verified_2026_27'},
 ...rules.expectedSemesterWindows.map(s=>({id:s.semester,title:({3:'Classical ML',4:'Deep learning',5:'One capstone',6:'PFE'})[s.semester],start:s.startApprox+'-01',end:new Date(Date.UTC(Number(s.endApprox.slice(0,4)),Number(s.endApprox.slice(5)),0)).toISOString().slice(0,10),confidence:'planning_assumption'}))
].map(s=>({...s,...semesterOverrides[s.id]}));
const bundle={version:catalog.version,resources:[...catalog.resources.map(({id,name,edition,url,provenance,semesters,priority})=>({id,name,edition,url,source:provenance,semesters,priority,enabled:true})),...extraResources],units,semesters,archiveRegistry:inventory.items.map(({id,semester,role,contentInspected})=>({id,semester,role,contentInspected,confidence:'historical_not_current',private:true})),legend:catalog.dataConfidenceLegend};
const publicBundle=correctEditions(bundle);
writeFileSync(new URL('../dist/catalog.json',import.meta.url),JSON.stringify(publicBundle,null,2)+'\n');
writeFileSync(new URL('../dist/planning.json',import.meta.url),JSON.stringify(rules,null,2)+'\n');
console.log(`${publicBundle.units.length} public units; ${inventory.items.length} opaque private references; no private filenames`);
// Machine-readable weekday roles from the approved research policy; UI reads this data.
rules.policyVersion=2;
rules.academicWindows=academicWindows;
rules.weeklyResources=weeklyResources;
rules.weeklySecondary=weeklySecondary;
rules.weeklySlots=weeklySlots;
rules.phases=phases;
rules.weeklyBlocks=weeklyBlocks;
writeFileSync(new URL('../dist/planning.json',import.meta.url),JSON.stringify(rules,null,2)+'\n');
