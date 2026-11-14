import http from 'node:http';
import { readFile, readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {assetPath} from './paths.mjs';
const read=promisify(readFile);
const projectRoot=path.dirname(fileURLToPath(import.meta.url));
const root=path.join(projectRoot,'dist');
const version=JSON.parse(readFileSync(path.join(projectRoot,'package.json'),'utf8')).version;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
export function createLearningServer(){
  return http.createServer(async(req,res)=>{
    const headers={'Cache-Control':'no-store','X-LearningOS-Version':version,'X-Content-Type-Options':'nosniff'};
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...headers,Allow:'GET, HEAD'});res.end();return;}
    try{
      const url=new URL(req.url,'http://localhost');
      if(url.pathname==='/health'){
        res.writeHead(200,{...headers,'Content-Type':'application/json; charset=utf-8'});
        res.end(req.method==='HEAD'?undefined:JSON.stringify({app:'LearningOS',version,projectRoot,pid:process.pid}));return;
      }
      const target=assetPath(root,url.pathname);
      if(!target){res.writeHead(403,headers);res.end();return;}
      const body=await read(target);
      res.writeHead(200,{...headers,'Content-Type':types[path.extname(target)]||'application/octet-stream'});
      res.end(req.method==='HEAD'?undefined:body);
    }catch{res.writeHead(404,headers);res.end(req.method==='HEAD'?undefined:'Not found');}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const server=createLearningServer();
  server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'Port 4173 is already in use. Close the other server, then run Start Learning OS.cmd again.':error.message);process.exitCode=1;});
  server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log(`LearningOS v${version}\nProject: ${projectRoot}\nLocal: http://127.0.0.1:${server.address().port}\nLeave this server running while you use the app.`));
}
