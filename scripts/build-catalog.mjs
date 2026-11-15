import {readFileSync,writeFileSync} from 'node:fs';
import {refineCatalog} from './refine-catalog.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../curriculum/'+name,import.meta.url),'utf8'));
const catalog=refineCatalog(read('public-catalog.json')),planning=read('planning.json');
for(const name of ['catalog','planning'])writeFileSync(new URL('../dist/'+name+'.json',import.meta.url),JSON.stringify(name==='catalog'?catalog:planning,null,2)+'\n');
console.log(`${catalog.units.length} public units; ${catalog.resources.length} resources; no private input files required.`);
