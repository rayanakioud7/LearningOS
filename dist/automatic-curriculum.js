import {normalizeCatalog} from './curriculum.js';
import {validateBackup} from './validation.js';

const refKey=(resource,ref)=>resource+'|'+String(ref||'').replace(/[§\s]/g,'').toLowerCase();
export const automaticCurriculumVersion='2026-11-15.2';
export const needsCurriculumUpdate=(state,catalog)=>state.schema===2&&!(state.curriculumRelease>=catalog.version&&state.automaticCurriculumVersion>=automaticCurriculumVersion);

// A catalog update makes work available; only immutable session outcomes establish completion.
export function synchronizeCurriculum(input,raw,at=new Date().toISOString()){
 if(!needsCurriculumUpdate(input,raw))return input;
 const s=structuredClone(input),catalog=normalizeCatalog(raw),oldRelease=s.curriculumRelease||null;
 const resources=new Map(s.resources.map(r=>[r.id,r]));
 for(const r of catalog.resources)if(!resources.has(r.id)){const next=structuredClone(r);s.resources.push(next);resources.set(r.id,next);}
 const nlp=resources.get('tunstall');if(nlp?.name==='Tunstall / Lewis / von Werra — NLP with Transformers'){
  const oldName=nlp.name;nlp.name=catalog.resources.find(r=>r.id==='tunstall').name;
  for(const t of s.tasks)if(t.resourceId==='tunstall'&&t.resource===oldName)t.resource=nlp.name;
 }
 const units=new Map(s.units.map(u=>[u.id,u])),tasksByUnit=new Map(s.tasks.map(t=>[t.unitId,t]));
 const byRef=new Map();for(const t of s.tasks)if(!byRef.has(refKey(t.resourceId,t.section)))byRef.set(refKey(t.resourceId,t.section),t);
 const aliases=new Map(),managed=[];
 for(const u of catalog.units){
  let t=tasksByUnit.get(u.id)||byRef.get(refKey(u.resourceId,u.unitRef));
  if(!t){
   const unit={id:u.id,resourceId:u.resourceId,unitRef:u.unitRef,heading:u.heading,semester:u.semester,kind:u.kind,dependencies:[],confidence:u.headingConfidence,source:u.sourceProvenance||'public_catalog',importBatchId:'automatic:'+catalog.version,suspended:false};
   s.units.push(unit);units.set(unit.id,unit);
   t={id:'catalog:'+u.id,unitId:u.id,resourceId:u.resourceId,resource:resources.get(u.resourceId).name,section:u.unitRef,heading:u.heading,title:'',action:u.activity,evidence:u.completionEvidence,minutes:u.estimatedMinutes,initialEstimateMinutes:u.estimatedMinutes,minimumMinutes:Math.min(25,u.estimatedMinutes),prerequisites:[],status:'active',reviewed:true,track:u.track,priority:u.priority,semester:u.semester,preferredDays:u.preferredDays,order:s.tasks.length,url:u.link,provenance:u.sourceProvenance||'public_catalog',confidence:u.headingConfidence,importBatchId:'automatic:'+catalog.version,primaryTrack:u.resourceId,branch:u.branch||null};
   s.tasks.push(t);tasksByUnit.set(u.id,t);byRef.set(refKey(t.resourceId,t.section),t);
  }
  aliases.set(u.id,t.unitId);managed.push([u,t]);
  const unit=units.get(t.unitId);
  // Keep customized titles, estimates, dependencies and in-flight tasks exactly as saved.
  const untouched=t.importBatchId?.startsWith('catalog:')||t.importBatchId?.startsWith('automatic:');
  const edited=unit?.confidence==='user_edited_heading'||s.revisions.some(r=>r.id?.startsWith('edit:'+t.id+':'));
  if(untouched&&!edited&&s.timer?.taskId!==t.id){
   t.heading=u.heading;t.section=u.unitRef;t.action=u.activity;t.evidence=u.completionEvidence;t.url=u.link;t.confidence=u.headingConfidence;
   Object.assign(unit,{heading:u.heading,unitRef:u.unitRef,confidence:u.headingConfidence});
  }
  if(u.referenceOnly)t.referenceOnly=true;
  if(u.referenceReason)t.referenceReason=u.referenceReason;
  t.title=t.resource+' '+t.section+' · '+t.heading;
 }
 for(const [u,t]of managed){
  if(!t.importBatchId?.startsWith('automatic:')||s.timer?.taskId===t.id)continue;
  const dependencies=u.dependencies.map(id=>aliases.get(id)||id),unit=units.get(t.unitId);
  unit.dependencies=dependencies;t.prerequisites=dependencies.map(id=>tasksByUnit.get(id)?.id||s.tasks.find(x=>x.unitId===id)?.id);
 }
 // The user's checkpoint starts at ILA §3.1.1. Do not repeat its section rollup or earlier topics.
 const ilaDetails=s.tasks.filter(t=>t.resourceId==='ila'&&/^§?3\.1\.[123]/.test(t.section));
 for(const t of s.tasks){
  if(t.status==='draft'){t.status='active';t.reviewed=true;}
  else if(t.status==='active')t.reviewed=true;
  const u=units.get(t.unitId);
  if(t.resourceId==='ila'&&(/^§?2\./.test(t.section)||/^§?3\.1$/.test(t.section)&&ilaDetails.length)){
   t.referenceOnly=true;t.referenceReason='Earlier checkpoint or section overview; detailed tasks carry the learning sequence.';
  }
  if(['academic_module','academic_course_file'].includes(u?.kind)&&!t.assignmentConfirmed){
   t.referenceOnly=true;t.referenceReason='Active curriculum reference; a current teacher assignment has not been supplied.';
  }
  // Replace old two-session trial summaries with the actual individual MIT sessions.
  if(t.resourceId==='mit1802'&&/Sessions?\s*(47[–-]48|49[–-]50)/i.test(t.section)){
   const numbers=t.section.match(/\d+/g)?.map(Number)||[];
   if(s.timer?.taskId!==t.id){t.referenceOnly=true;t.referenceReason='Trial overview; individual MIT sessions are scheduled.';}
   for(const chapter of s.tasks.filter(x=>x.resourceId==='mit1802'&&/^Session \d+$/.test(x.section)&&numbers.includes(Number(x.section.match(/\d+/)[0]))))chapter.coveredBy=[...new Set([...(chapter.coveredBy||[]),t.id])];
  }
 }
 // A new canonical ILA §3.2 must follow the saved §3.1.3 activity, not an inactive overview.
 const lastDetail=ilaDetails.find(t=>/^§?3\.1\.3$/.test(t.section));
 const nextIla=s.tasks.find(t=>t.resourceId==='ila'&&/^§?3\.2$/.test(t.section));
 if(lastDetail&&nextIla?.importBatchId?.startsWith('automatic:')){nextIla.prerequisites=[lastDetail.id];units.get(nextIla.unitId).dependencies=[lastDetail.unitId];}
 s.curriculumRelease=catalog.version;s.automaticCurriculumVersion=automaticCurriculumVersion;
 s.settings.automaticCurriculum=true;
 s.revisions.push({id:'automatic-curriculum:'+catalog.version,author:'You',at,old:{curriculumRelease:oldRelease},new:{curriculumRelease:catalog.version,activeTasks:s.tasks.filter(t=>t.status==='active').length},reason:'Activate the complete curriculum at the learner’s request; apply precise source headings without changing recorded progress.'});
 return validateBackup(s);
}
