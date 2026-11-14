import {validateBackup,validateGraph} from './validation.js';
const copy=x=>structuredClone(x);
const slug=s=>String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const key=u=>`${u.resourceId}|${String(u.unitRef||'').replace(/[§\s]/g,'').toLowerCase()}`;
export function defaultSlots(){return [
 {day:0,minutes:0,role:'rest',fixed:true,resources:[]},
 {day:1,minutes:75,role:'primary',fixed:true,resources:[]},
 {day:2,minutes:75,role:'lecture',fixed:true,resources:[]},
 {day:3,minutes:0,role:'academic',fixed:true,resources:[]},
 {day:4,minutes:75,role:'support',fixed:true,resources:[]},
 {day:5,minutes:0,role:'academic',fixed:true,resources:[]},
 {day:6,minutes:150,role:'builder',fixed:true,resources:[]}
];}
function resourceFor(t,bundle){const n=t.resource.toLowerCase();return bundle.resources.find(r=>r.name===t.resource)?.id||(n.includes('linear algebra')||n==='ila'?'ila':n.includes('mit')?'mit1802':n.includes('stat 110')?'stat110':n.startsWith('ensam')?'ensam':'legacy-'+slug(t.resource));}
export function migrateState(input,bundle,planning,at=new Date().toISOString()){
 validateBackup(input);if(input.schema===2)return copy(input);
 const s=copy(input);s.schema=2;s.resources=copy(bundle.resources);s.units=[];s.semesters=copy(bundle.semesters);s.archiveRegistry=copy(bundle.archiveRegistry);s.importBatches=[];s.attachments=[];s.pinnedDay=null;
 s.settings={...s.settings,weeklyMinutes:Math.min(480,s.settings.weeklyMinutes),dailyMinutes:Math.min(90,s.settings.dailyMinutes),saturdayMinutes:Math.min(180,s.settings.saturdayMinutes),examPrepLeadDays:14,pfeMode:false,recoveryDays:[],preferredResources:[],campusTimetable:[]};
 s.calendarSlots=defaultSlots();s.planning=copy(planning);
 for(const t of s.tasks){
  const resourceId=resourceFor(t,bundle);if(!s.resources.some(r=>r.id===resourceId))s.resources.push({id:resourceId,name:t.resource,edition:'unconfirmed',source:'legacy_user_state',url:t.url||'',enabled:true});
  const unitId='legacy:'+t.id;t.unitId=unitId;t.resourceId=resourceId;t.legacyId=t.id;t.reviewed=t.status==='active';t.priority=t.priority||(t.track==='academic'?'P0':'P1');t.semester=t.semester||1;t.primaryTrack=t.primaryTrack||resourceId;t.importBatchId='legacy-v1';
  s.units.push({id:unitId,resourceId,unitRef:t.section||t.id,heading:t.heading,semester:t.semester,kind:'legacy_activity',dependencies:[],confidence:'legacy_provenance_requires_review',source:t.provenance||'legacy_user_state',legacyId:t.id,importBatchId:'legacy-v1',suspended:false});
 }
 const byTask=new Map(s.tasks.map(t=>[t.id,t.unitId]));for(const t of s.tasks)s.units.find(u=>u.id===t.unitId).dependencies=t.prerequisites.map(id=>byTask.get(id));
 s.calendar=s.calendar.map(w=>({...w,confidence:w.source==='calendar_image'?'verified_2026_27':w.kind==='exam_prep'?'authored_recommendation':'user_confirmed',individual_exam_times_known:false}));
 s.migration={from:1,to:2,at};s.revisions.push({id:'migration-v2',author:'local migration',at,old:{schema:1},new:{schema:2},reason:'Preserve browser progress; add curriculum references and explicit weekly slots'});
 return validateBackup(s);
}
export function normalizeCatalog(raw){
 if(!raw||!Array.isArray(raw.resources)||!Array.isArray(raw.units)||raw.units.length>5000)throw Error('Choose a curriculum catalog with resources and units.');
 return {version:String(raw.version||'local-import'),resources:raw.resources.map(r=>({...r,source:r.source||r.provenance||'user_import',enabled:r.enabled??true})),units:raw.units.map(u=>({...u,unitRef:u.unitRef||u.section||u.id,headingConfidence:u.headingConfidence||u.confidence||'user_authored',dependencies:u.dependencies||[],estimatedMinutes:u.estimatedMinutes??u.minutes,activity:u.activity||u.action,completionEvidence:u.completionEvidence||u.evidence,link:u.link||'',preferredDays:u.preferredDays||[],priority:u.priority||'P1',track:u.track||'independent',kind:u.kind||'reading'}))};
}
export function previewImport(state,raw){
 const catalog=normalizeCatalog(raw),resourceIds=new Set([...state.resources,...catalog.resources].map(r=>r.id)),ids=new Set(),canonical=new Map();
 for(const r of catalog.resources)if(typeof r.id!=='string'||!r.id.trim()||typeof r.name!=='string'||!r.name.trim())throw Error('Invalid resource.');
 if(new Set(catalog.resources.map(r=>r.id)).size!==catalog.resources.length)throw Error('Conflicting canonical resource IDs.');
 const rows=catalog.units.map(u=>{
  if(!u.id||ids.has(u.id))throw Error('Conflicting canonical unit ID: '+u.id);ids.add(u.id);
  if(!resourceIds.has(u.resourceId)||typeof u.heading!=='string'||!u.heading.trim()||typeof u.activity!=='string'||!u.activity.trim()||typeof u.completionEvidence!=='string'||!u.completionEvidence.trim()||!Number.isFinite(u.estimatedMinutes)||u.estimatedMinutes<1||u.estimatedMinutes>10000||!Number.isInteger(u.semester)||u.semester<1||u.semester>6||!['P0','P1','P2','P3'].includes(u.priority)||!['academic','independent'].includes(u.track)||!Array.isArray(u.preferredDays)||u.preferredDays.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Invalid unit fields: '+u.id);
  const old=state.units.find(x=>x.id===u.id),same=state.units.find(x=>key(x)===key(u)&&x.heading===u.heading),near=state.units.find(x=>key(x)===key(u)),collision=canonical.get(key(u));canonical.set(key(u),u.id);
  const kind=old?(old.resourceId!==u.resourceId||old.unitRef!==u.unitRef?'conflict':old.heading!==u.heading?'renamed':'duplicate'):same?'duplicate':near?'renamed':collision?'conflict':'add';
  return {unit:u,kind,existingId:old?.id||same?.id||near?.id,diff:old||near?{oldHeading:(old||near).heading,newHeading:u.heading}:null};
 });
 const all=[...state.units,...catalog.units.filter(u=>!state.units.some(x=>x.id===u.id))];validateGraph(all.map(u=>({id:u.id,prerequisites:u.dependencies||[]})),'unit');
 return {catalog,rows,counts:Object.fromEntries(['add','duplicate','renamed','conflict'].map(k=>[k,rows.filter(r=>r.kind===k).length])),resourceConflicts:catalog.resources.filter(r=>state.resources.some(x=>x.id===r.id&&x.edition&&r.edition&&x.edition!==r.edition)).map(r=>r.id)};
}
export function applyImport(state,raw,selectedIds,{activate=false,reviewed=false,author='You',at=new Date().toISOString()}={}){
 const preview=previewImport(state,raw);if(activate&&!reviewed)throw Error('Review the selected units before activation.');
 const selected=new Set(selectedIds),rows=preview.rows.filter(r=>selected.has(r.unit.id));if(rows.some(r=>r.kind==='conflict'||r.kind==='renamed'))throw Error('Resolve renamed or conflicting units explicitly; existing work is preserved.');
 if(!rows.some(r=>r.kind==='add'))return copy(state);
 const conflicts=preview.resourceConflicts.filter(id=>rows.some(r=>r.unit.resourceId===id));if(conflicts.length)throw Error('Resource edition conflict: '+conflicts.join(', '));
 const s=copy(state),batchId='catalog:'+preview.catalog.version;
 for(const r of preview.catalog.resources)if(rows.some(row=>row.unit.resourceId===r.id)&&!s.resources.some(x=>x.id===r.id))s.resources.push(copy(r));
 const aliases=new Map(preview.rows.filter(r=>r.existingId).map(r=>[r.unit.id,r.existingId]));
 for(const row of rows){if(row.kind!=='add')continue;const u=row.unit;if((u.branch||u.kind==='academic_module'||u.kind==='academic_course_file')&&activate)throw Error('Optional branches and academic placeholders need individual task review before activation.');
  if(u.dependencies.some(id=>!selected.has(id)&&!aliases.has(id)&&!s.units.some(x=>x.id===id)))throw Error('Select the prerequisite unit first: '+u.id);
  const unit={id:u.id,resourceId:u.resourceId,unitRef:u.unitRef,heading:u.heading,semester:u.semester,kind:u.kind,dependencies:u.dependencies.map(id=>aliases.get(id)||id),confidence:u.headingConfidence,source:u.sourceProvenance||'user_import',importBatchId:batchId,branch:u.branch||null,suspended:false,...(u.sourceLocator?{privateLocator:copy(u.sourceLocator)}:{})};s.units.push(unit);
  const res=s.resources.find(r=>r.id===u.resourceId);s.tasks.push({id:'catalog:'+u.id,unitId:u.id,resourceId:u.resourceId,resource:res.name,section:u.unitRef,heading:u.heading,title:res.name+' '+u.unitRef+' · '+u.heading,action:u.activity,evidence:u.completionEvidence,minutes:u.estimatedMinutes,minimumMinutes:Math.min(25,u.estimatedMinutes),prerequisites:[],status:activate?'active':'draft',reviewed,track:u.track,priority:u.priority,semester:u.semester,preferredDays:u.preferredDays,order:s.tasks.length,url:u.link,provenance:u.sourceProvenance||'user_import',confidence:u.headingConfidence,importBatchId:batchId,primaryTrack:u.resourceId,branch:u.branch||null});
 }
 const taskFor=id=>s.tasks.find(t=>t.unitId===id)?.id;
 for(const row of rows.filter(r=>r.kind==='add')){const task=s.tasks.find(t=>t.unitId===row.unit.id);task.prerequisites=s.units.find(u=>u.id===row.unit.id).dependencies.map(id=>{const t=taskFor(id);if(!t)throw Error('Orphan dependency: '+id);return t;});}
 if(rows.some(r=>r.kind==='add')){s.importBatches.push({id:batchId,at,unitIds:rows.filter(r=>r.kind==='add').map(r=>r.unit.id)});s.revisions.push({id:batchId+':'+s.revisions.length,author,at,old:null,new:{unitIds:rows.filter(r=>r.kind==='add').map(r=>r.unit.id),activate,reviewed},reason:'Reviewed catalog selection'});}
 return validateBackup(s);
}
export function reviseTask(state,id,patch,{author='You',at=new Date().toISOString(),newId=id+':followup:'+state.revisions.length}={}){
 const s=copy(state),t=s.tasks.find(t=>t.id===id);if(!t)throw Error('Task not found.');if(s.timer?.taskId===id)throw Error('Finish the active session before editing its task.');
 const voided=new Set(s.events.filter(e=>e.type==='void').map(e=>e.target));const done=s.events.some(e=>e.taskId===id&&e.outcome==='completed'&&!voided.has(e.id));
 let next={...t,...copy(patch),reviewed:patch.status==='active'?true:patch.reviewed??t.reviewed};
 if(next.resource!==t.resource){let resource=s.resources.find(r=>r.name===next.resource);if(!resource){resource={id:'local:'+slug(next.resource),name:next.resource,edition:'unconfirmed',source:'user_authored',url:next.url||'',enabled:true};s.resources.push(resource);}next.resourceId=resource.id;next.primaryTrack=resource.id;}
 if(next.status==='active'&&s.units.find(u=>u.id===next.unitId)?.kind&&['academic_module','academic_course_file'].includes(s.units.find(u=>u.id===next.unitId).kind)&&(!next.teacherConfirmed||!next.assignmentConfirmed))throw Error('Confirm current teacher material and specify an actual assignment before activating an academic placeholder.');
 if(done){next.id=newId;next.unitId='followup:'+newId;s.units.push({...copy(s.units.find(u=>u.id===t.unitId)),id:next.unitId,resourceId:next.resourceId,heading:next.heading,dependencies:next.prerequisites.map(id=>s.tasks.find(t=>t.id===id)?.unitId),kind:'authored_followup',confidence:'authored_followup',sourceHeading:s.units.find(u=>u.id===t.unitId)?.sourceHeading||t.heading});s.tasks.push(next);}else{s.tasks[s.tasks.findIndex(x=>x.id===id)]=next;const unit=s.units.find(u=>u.id===next.unitId);if(next.heading!==t.heading){unit.sourceHeading=unit.sourceHeading||unit.heading;unit.confidence='user_edited_heading';}Object.assign(unit,{resourceId:next.resourceId,heading:next.heading,unitRef:next.section,semester:next.semester,dependencies:next.prerequisites.map(id=>s.tasks.find(t=>t.id===id)?.unitId)});}
 if(next.archived&&s.pinnedDay?.taskId===id)s.pinnedDay=null;
 s.revisions.push({id:'edit:'+id+':'+s.revisions.length,author,at,old:copy(t),new:copy(next)});return validateBackup(s);
}
export function setResourceEnabled(state,id,enabled){const s=copy(state),r=s.resources.find(r=>r.id===id);if(!r)throw Error('Resource not found.');r.enabled=enabled;if(!enabled&&s.pinnedDay&&s.tasks.find(t=>t.id===s.pinnedDay.taskId)?.resourceId===id)s.pinnedDay=null;s.revisions.push({id:'resource:'+id+':'+s.revisions.length,author:'You',old:{enabled:!enabled},new:{enabled},resourceId:id});return validateBackup(s);}
export function addLocalTask(state,task){const s=copy(state);let r=s.resources.find(r=>r.name===task.resource);if(!r){r={id:'local:'+slug(task.resource),name:task.resource,edition:'unconfirmed',source:'user_authored',url:task.url||'',enabled:true};s.resources.push(r);}const t={...task,resourceId:r.id,unitId:'local:'+task.id,reviewed:task.status==='active',semester:task.semester||1,priority:task.priority||(task.track==='academic'?'P0':'P1'),primaryTrack:r.id};s.units.push({id:t.unitId,resourceId:r.id,unitRef:t.section||t.id,heading:t.heading,semester:t.semester,kind:'user_authored',confidence:'user_authored',source:'You',dependencies:t.prerequisites.map(id=>s.tasks.find(t=>t.id===id)?.unitId)});s.tasks.push(t);return validateBackup(s);}
export function reconcileAttempts(current,incoming){
 validateBackup(incoming);const s=copy(current),events=new Map(s.events.map(e=>[e.id,e]));
 for(const e of incoming.events){if(events.has(e.id)&&JSON.stringify(events.get(e.id))!==JSON.stringify(e))throw Error('Conflicting immutable attempt: '+e.id);if(!events.has(e.id)){if(e.type==='session'&&!s.tasks.some(t=>t.id===e.taskId))throw Error('Import the missing task before reconciling attempts: '+e.taskId);s.events.push(copy(e));events.set(e.id,e);}}
 return validateBackup(s);
}
export const syncAdapter={async push(){throw Error('Cloud sync is not configured. Use manual backup or reconcile attempts.');}};
