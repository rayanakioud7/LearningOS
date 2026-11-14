import {validateBackup} from './validation.js';
import {applyPlanningUpdate} from './roadmap.js';
import {migrateState} from './curriculum.js';
export function openDatabase(factory=globalThis.indexedDB){
  return new Promise((resolve,reject)=>{const r=factory.open('ensam-learning-os',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('state'))r.result.createObjectStore('state');};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close the other LearningOS tabs, then try again.'));});
}
export function readSaved(db,key='main'){
  return new Promise((resolve,reject)=>{const tx=db.transaction('state','readonly'),r=tx.objectStore('state').get(key);tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Could not read saved data.'));});
}
export function saveChange(db,expectedRevision,change,fallback,{preservePrevious=false,preservePlanning=false}={}){
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('state','readwrite'),store=tx.objectStore('state'),read=store.get('main');let next,failure;
    read.onsuccess=()=>{try{
      const current=read.result??fallback;if(!current)throw Error('No study space found.');
      if(current.revision!==expectedRevision)throw Error('Another tab changed your plan. Refresh this page before making another change.');
      next=change(structuredClone(current));if(!next||typeof next.then==='function')throw Error('The save could not be completed.');
      next.revision=(current.revision||0)+1;next.updatedAt=new Date().toISOString();validateBackup(next);
      if(!preservePrevious&&current.events.some(e=>!next.events.some(n=>n.id===e.id&&JSON.stringify(n)===JSON.stringify(e))))throw Error('Saved session attempts are immutable. Use an explicit backup restore or correction.');
      if(current.schema===1&&next.schema===2)store.put({state:current,savedAt:next.updatedAt},'migration-v1');
      if(preservePlanning&&read.result)store.put({state:current,savedAt:next.updatedAt},'planning-before-'+next.planning.policyVersion);
      if(preservePrevious&&read.result)store.put({state:current,savedAt:next.updatedAt},'restore-point');
      store.put(next,'main');
    }catch(error){failure=error;tx.abort();}};
    tx.oncomplete=()=>resolve(next);tx.onabort=()=>reject(failure||tx.error||Error('The change could not be saved.'));tx.onerror=()=>reject(failure||tx.error);
  });
}
export async function migrateDatabase(db,bundle,planning){
  const current=await readSaved(db);if(!current||current.schema===2)return current;
  // migration-v1 is written in the same transaction; keep any older restore-point intact.
  try{return await saveChange(db,current.revision,s=>migrateState(s,bundle,planning));}
  catch(error){const latest=await readSaved(db);if(latest?.schema===2)return latest;throw error;}
}

export async function refreshPlanningDatabase(db,planning){
 const current=await readSaved(db);if(!current||current.schema!==2||current.planning?.policyVersion===planning.policyVersion)return current;
 try{return await saveChange(db,current.revision,s=>applyPlanningUpdate(s,planning),null,{preservePlanning:true});}
 catch(error){const latest=await readSaved(db);if(latest?.planning?.policyVersion===planning.policyVersion)return latest;throw error;}
}
