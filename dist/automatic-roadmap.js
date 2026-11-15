// Derived readiness uses real outcomes, or an isolated forecast's completion set.
// Forecast progress lives only in this WeakMap and is never serialized or saved.
const projections=new WeakMap();
export function setProjectionProgress(state,done){projections.set(state,done);}
export function effectiveProgress(s,done){
 let result=done;
 for(const t of s.tasks)if(t.coveredBy?.some(id=>done.has(id))&&!done.has(t.id)){if(result===done)result=new Set(done);result.add(t.id);}
 return result;
}
export function progressSet(s){
 if(projections.has(s))return projections.get(s);
 const voided=new Set(s.events.filter(e=>e.type==='void').map(e=>e.target));
 return new Set(s.events.filter(e=>e.type==='session'&&e.outcome==='completed'&&!voided.has(e.id)).map(e=>e.taskId));
}
export function derivedGate(s,id){
 if(!s.settings?.automaticCurriculum)return false;
 const done=progressSet(s),has=(resource,ref)=>s.tasks.some(t=>t.resourceId===resource&&(t.unitId===ref||t.unitId==='legacy:'+ref||String(t.section).replace(/[§\s]/g,'').toLowerCase()===ref)&&done.has(t.id));
 const milestone=id=>s.tasks.some(t=>(t.unitId===id||t.id==='catalog:'+id)&&done.has(t.id));
 if(id==='linear-foundations')return ['5.1','6.1','6.3','6.5'].every(ref=>has('ila',ref));
 if(id==='svd')return has('svd','svd:lecture-29')||has('mml','ch4');
 if(id==='ml-evaluation')return milestone('builder:numerical-and-classical-ml-m7');
 if(id==='cpu-correctness')return milestone('builder:minitorch-in-c-m10');
 if(id==='measured-bottleneck')return milestone('builder:ml-systems-capstone-m13');
 if(id==='pretrained-baseline')return milestone('huggingface:baseline');
 if(id==='s1-project')return milestone('builder:foundations-toolkit-m1')&&milestone('builder:foundations-toolkit-m2')&&milestone('missing:workshop-1');
 if(id==='s2-project')return milestone('builder:numerical-least-squares');
 if(id==='s3-project')return milestone('builder:numerical-and-classical-ml-m7');
 if(id==='capstone')return milestone('builder:ml-systems-capstone-m13');
 return false;
}
export function automaticClinicUnit(s){
 const done=progressSet(s),pending=s.tasks.filter(t=>t.resourceId==='geron'&&!t.referenceOnly&&!t.archived&&!done.has(t.id)).sort((a,b)=>(a.order??999)-(b.order??999))[0];
 const n=Number((pending?.section.match(/(?:chapter|ch)\s*(\d+)/i)||[])[1])||1;
 const preferred=n<=2?['mml:ch-9','cs229:lecture-2']:n<=4?['cs229:lecture-3','cs229:lecture-4','mml:ch-9']:n<=6?['cs229:lecture-9','cs229:lecture-8']:n===7?['mml:ch-10','cs229:lecture-15']:['cs229:lecture-13','cs229:lecture-12'];
 // A reference is selected once from the relevant topic; no parallel lecture sequence.
 return preferred.find(id=>s.tasks.some(t=>t.unitId===id&&!t.archived&&!done.has(t.id)))||null;
}
export function automaticSupport(s,phase,block){
 if(!s.settings?.automaticCurriculum)return null;
 const done=progressSet(s),pending=id=>s.tasks.some(t=>t.unitId===id&&!t.archived&&!t.referenceOnly&&!done.has(t.id));
 if(phase==='S1'&&block.id==='c-lab'&&pending('missing:workshop-1'))return 'git';
 if(phase==='S2'&&block.id==='ila-s2'&&derivedGate(s,'linear-foundations')&&pending('svd:lecture-29')&&!s.tasks.some(t=>t.resourceId==='ila'&&!t.referenceOnly&&!t.archived&&!done.has(t.id)))return 'svd';
 if(phase==='S3'&&block.id==='ml-lab'&&derivedGate(s,'ml-evaluation'))return 'micrograd';
 if(phase==='S5'&&block.id==='pretrained'&&pending('huggingface:baseline'))return 'hf-course';
 return null;
}
