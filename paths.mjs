import path from 'node:path';
export function assetPath(root,pathname){
  root=path.resolve(root);
  const decoded=decodeURIComponent(pathname),name=decoded==='/'?'index.html':decoded.slice(1);
  const target=path.resolve(root,name);
  return target.startsWith(root+path.sep)&&!name.includes('\\')?target:null;
}
