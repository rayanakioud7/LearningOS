// Keep an installed app shell coherent. A new version waits for an explicit
// reload, so an open tab cannot mix old and new ES modules during an update.
const CACHE='ensam-app-0.12.0-study-day';
const ASSETS=['./','./index.html','./style.css','./experience.css','./find.js','./settings-view.js','./app.js','./refresher.js','./refresher-questions.js','./search.js','./automatic-curriculum.js','./automatic-roadmap.js','./transfer-view.js','./outcome-view.js','./engine.js','./today.js','./planner.js','./roadmap.js','./roadmap-view.js','./navigation.js','./session.js','./effort.js','./calendar-view.js','./history-view.js','./curriculum.js','./views.js','./catalog.json','./planning.json','./validation.js','./storage.js','./backup.js','./seed.json','./icon.svg','./manifest.webmanifest'];
const assetURLs=new Set(ASSETS.map(asset=>new URL(asset,self.location.href).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ensam-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname==='/health')return;
 const canonical=url.origin+url.pathname;
 if(!assetURLs.has(canonical))return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(canonical);if(cached)return cached;
  // Do not add arbitrary URLs, backups or user documents to the app cache.
  return fetch(event.request);
 }));
});
