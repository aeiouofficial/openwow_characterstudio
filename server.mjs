#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);
const WORKSPACE = path.join(ROOT, '.character-studio-workspace');
const PRESETS_FILE = path.join(WORKSPACE, 'source-presets.json');
const LIBDIR = path.join(WORKSPACE, 'library');
const MAX_JSON = 2 * 1024 * 1024;
const MIME = {
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.bmp':'image/bmp',
  '.glb':'model/gltf-binary','.gltf':'model/gltf+json','.bin':'application/octet-stream','.zip':'application/zip',
};
const KINDS = new Set(['objectcomponents','texturecomponents']);

const safeName = value => String(value || 'Default').trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/^\.+|\.+$/g, '').slice(0, 80) || 'Default';
const json = (res, status, body) => {
  const data = Buffer.from(JSON.stringify(body, null, 2));
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','content-length':data.length,'cache-control':'no-store'});
  res.end(data);
};
const readBody = async (req, limit = MAX_JSON) => {
  const chunks=[]; let total=0;
  for await (const chunk of req) { total += chunk.length; if(total > limit) throw new Error('Request body too large'); chunks.push(chunk); }
  return Buffer.concat(chunks);
};
const defaultState = () => ({
  version:1,
  activePreset:'Default',
  presets:[{name:'Default',objectcomponents:{path:'',managed:false,count:0},texturecomponents:{path:'',managed:false,count:0}}],
});
async function loadState(){
  await fsp.mkdir(WORKSPACE,{recursive:true});
  try{
    const state=JSON.parse(await fsp.readFile(PRESETS_FILE,'utf8'));
    if(!Array.isArray(state.presets)) throw new Error('bad preset file');
    return state;
  }catch{
    const state=defaultState(); await saveState(state); return state;
  }
}
async function saveState(state){
  await fsp.mkdir(WORKSPACE,{recursive:true});
  const tmp=PRESETS_FILE+'.tmp';
  await fsp.writeFile(tmp,JSON.stringify(state,null,2));
  await fsp.rename(tmp,PRESETS_FILE);
}
function ensurePreset(state,name){
  const clean=safeName(name);
  let preset=state.presets.find(p=>p.name===clean);
  if(!preset){ preset={name:clean,objectcomponents:{path:'',managed:false,count:0},texturecomponents:{path:'',managed:false,count:0}}; state.presets.push(preset); }
  return preset;
}
async function countFiles(dir){
  let total=0; const stack=[dir];
  while(stack.length){
    const cur=stack.pop(); let list;
    try{list=await fsp.readdir(cur,{withFileTypes:true});}catch{continue;}
    for(const ent of list){ const p=path.join(cur,ent.name); if(ent.isDirectory()) stack.push(p); else if(ent.isFile()) total++; }
  }
  return total;
}
function isSubPath(root,target){
  const r=path.resolve(root)+path.sep, t=path.resolve(target);
  return t===path.resolve(root)||t.startsWith(r);
}
function locateEocd(fd,size){
  const tailLen=Math.min(size,65558+40);
  const tail=Buffer.alloc(tailLen); fs.readSync(fd,tail,0,tailLen,size-tailLen);
  for(let i=tailLen-22;i>=0;i--) if(tail.readUInt32LE(i)===0x06054b50) return {tail,offset:i,base:size-tailLen};
  throw new Error('Not a valid ZIP archive (EOCD missing)');
}
function parseZipEntries(zipPath){
  const fd=fs.openSync(zipPath,'r');
  try{
    const size=fs.fstatSync(fd).size;
    const {tail,offset}=locateEocd(fd,size);
    let count=tail.readUInt16LE(offset+10), cdSize=tail.readUInt32LE(offset+12), cdOfs=tail.readUInt32LE(offset+16);
    if(count===0xffff||cdSize===0xffffffff||cdOfs===0xffffffff) throw new Error('ZIP64 uploads are not supported by the local bridge yet');
    const cd=Buffer.alloc(cdSize); fs.readSync(fd,cd,0,cdSize,cdOfs);
    const entries=[]; let p=0;
    for(let i=0;i<count&&p+46<=cd.length;i++){
      if(cd.readUInt32LE(p)!==0x02014b50) break;
      const method=cd.readUInt16LE(p+10), csize=cd.readUInt32LE(p+20), usize=cd.readUInt32LE(p+24);
      const nlen=cd.readUInt16LE(p+28), elen=cd.readUInt16LE(p+30), clen=cd.readUInt16LE(p+32), lho=cd.readUInt32LE(p+42);
      const name=cd.subarray(p+46,p+46+nlen).toString('utf8').replace(/\\/g,'/');
      entries.push({name,method,csize,usize,lho,dir:name.endsWith('/')});
      p+=46+nlen+elen+clen;
    }
    return entries;
  } finally { fs.closeSync(fd); }
}
function readEntry(zipPath,ent){
  const fd=fs.openSync(zipPath,'r');
  try{
    const lh=Buffer.alloc(30); fs.readSync(fd,lh,0,30,ent.lho);
    if(lh.readUInt32LE(0)!==0x04034b50) throw new Error('Bad ZIP local header: '+ent.name);
    const nlen=lh.readUInt16LE(26), elen=lh.readUInt16LE(28), start=ent.lho+30+nlen+elen;
    const compressed=Buffer.alloc(ent.csize); fs.readSync(fd,compressed,0,ent.csize,start);
    if(ent.method===0) return compressed;
    if(ent.method===8) return zlib.inflateRawSync(compressed);
    throw new Error(`Unsupported ZIP compression method ${ent.method} for ${ent.name}`);
  } finally { fs.closeSync(fd); }
}
function stripKindPrefix(name,kind){
  const parts=name.split('/').filter(Boolean);
  const ix=parts.findIndex(p=>p.toLowerCase()===kind.toLowerCase());
  return (ix>=0?parts.slice(ix+1):parts).join('/');
}
async function extractZip(zipPath,dest,kind){
  const entries=parseZipEntries(zipPath); let files=0, bytes=0;
  const hasKindRoot=entries.some(ent=>ent.name.split('/').filter(Boolean).some(part=>part.toLowerCase()===kind.toLowerCase()));
  await fsp.rm(dest,{recursive:true,force:true}); await fsp.mkdir(dest,{recursive:true});
  for(const ent of entries){
    if(ent.dir) continue;
    const parts=ent.name.split('/').filter(Boolean);
    if(hasKindRoot&&!parts.some(part=>part.toLowerCase()===kind.toLowerCase())) continue;
    const rel=stripKindPrefix(ent.name,kind);
    if(!rel) continue;
    const normalized=path.posix.normalize('/'+rel).slice(1);
    if(normalized.startsWith('../')||normalized.includes('/../')) throw new Error('Unsafe ZIP path: '+ent.name);
    const target=path.join(dest,...normalized.split('/'));
    if(!isSubPath(dest,target)) throw new Error('Unsafe ZIP path: '+ent.name);
    await fsp.mkdir(path.dirname(target),{recursive:true});
    const data=readEntry(zipPath,ent); await fsp.writeFile(target,data); files++; bytes+=data.length;
  }
  return {files,bytes,entries:entries.length};
}
async function streamUpload(req,target){
  await fsp.mkdir(path.dirname(target),{recursive:true});
  const out=fs.createWriteStream(target,{flags:'w'});
  let bytes=0;
  try{
    for await (const chunk of req){ bytes+=chunk.length; if(!out.write(chunk)) await new Promise(r=>out.once('drain',r)); }
    await new Promise((resolve,reject)=>out.end(err=>err?reject(err):resolve()));
    return bytes;
  }catch(err){ out.destroy(); await fsp.rm(target,{force:true}); throw err; }
}
async function validateAndSavePaths(payload){
  const state=await loadState(); const preset=ensurePreset(state,payload.name||state.activePreset);
  for(const kind of KINDS){
    if(payload[kind]===undefined) continue;
    const raw=String(payload[kind]||'').trim();
    if(!raw){ preset[kind]={path:'',managed:false,count:0}; continue; }
    const resolved=path.resolve(raw);
    const st=await fsp.stat(resolved).catch(()=>null);
    if(!st?.isDirectory()) throw new Error(`${kind} folder does not exist: ${raw}`);
    preset[kind]={path:resolved,managed:false,count:await countFiles(resolved)};
  }
  state.activePreset=preset.name; await saveState(state); return state;
}
async function listAssets(presetName,kind,q='',limit=100){
  if(!KINDS.has(kind)) throw new Error('Unknown source kind');
  const state=await loadState(); const preset=state.presets.find(p=>p.name===presetName)||state.presets.find(p=>p.name===state.activePreset);
  const root=preset?.[kind]?.path; if(!root) return {preset:preset?.name||'',kind,root:'',items:[],count:0};
  const items=[], needle=q.toLowerCase(); const stack=[root];
  while(stack.length&&items.length<limit){
    const cur=stack.pop(); let list;
    try{list=await fsp.readdir(cur,{withFileTypes:true});}catch{continue;}
    for(const ent of list){
      const p=path.join(cur,ent.name);
      if(ent.isDirectory()) stack.push(p);
      else if(ent.isFile()){
        const rel=path.relative(root,p).split(path.sep).join('/');
        if(!needle||rel.toLowerCase().includes(needle)) items.push({path:rel,name:ent.name,ext:path.extname(ent.name).toLowerCase()});
        if(items.length>=limit) break;
      }
    }
  }
  return {preset:preset?.name||'',kind,root,items,count:preset?.[kind]?.count||0};
}
function serveFile(res,file){
  const ext=path.extname(file).toLowerCase(); const type=MIME[ext]||'application/octet-stream';
  const st=fs.statSync(file); res.writeHead(200,{'content-type':type,'content-length':st.size,'cache-control':'no-cache'}); fs.createReadStream(file).pipe(res);
}

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://${req.headers.host||HOST}`);
    if(url.pathname==='/api/health') return json(res,200,{ok:true,root:ROOT,workspace:WORKSPACE});
    if(url.pathname==='/api/source-presets'&&req.method==='GET') return json(res,200,await loadState());
    if(url.pathname==='/api/source-presets'&&req.method==='PUT'){
      const payload=JSON.parse((await readBody(req)).toString('utf8')||'{}');
      return json(res,200,await validateAndSavePaths(payload));
    }
    if(url.pathname==='/api/source-presets'&&req.method==='DELETE'){
      const state=await loadState(), name=safeName(url.searchParams.get('name'));
      state.presets=state.presets.filter(p=>p.name!==name);
      if(!state.presets.length) state.presets=defaultState().presets;
      if(!state.presets.some(p=>p.name===state.activePreset)) state.activePreset=state.presets[0].name;
      await saveState(state); return json(res,200,state);
    }
    if(url.pathname==='/api/import-zip'&&req.method==='POST'){
      const kind=String(url.searchParams.get('kind')||''); if(!KINDS.has(kind)) return json(res,400,{ok:false,error:'kind must be objectcomponents or texturecomponents'});
      const presetName=safeName(url.searchParams.get('preset')||'Default');
      const upload=path.join(WORKSPACE,'uploads',`${Date.now()}-${safeName(url.searchParams.get('filename')||kind+'.zip')}`);
      const uploaded=await streamUpload(req,upload);
      const dest=path.join(WORKSPACE,'presets',presetName,kind);
      const result=await extractZip(upload,dest,kind); await fsp.rm(upload,{force:true});
      const state=await loadState(), preset=ensurePreset(state,presetName);
      preset[kind]={path:dest,managed:true,count:result.files}; state.activePreset=preset.name; await saveState(state);
      return json(res,200,{ok:true,preset:preset.name,kind,uploaded,...result,path:dest,state});
    }
    if(url.pathname==='/api/assets'&&req.method==='GET'){
      const kind=String(url.searchParams.get('kind')||''); const preset=String(url.searchParams.get('preset')||'');
      const q=String(url.searchParams.get('q')||''); const limit=Math.min(500,Math.max(1,Number(url.searchParams.get('limit')||100)));
      return json(res,200,await listAssets(preset,kind,q,limit));
    }
    if(url.pathname==='/api/asset'&&req.method==='GET'){
      const kind=String(url.searchParams.get('kind')||''); if(!KINDS.has(kind)) return json(res,400,{error:'invalid kind'});
      const state=await loadState(), presetName=String(url.searchParams.get('preset')||state.activePreset);
      const preset=state.presets.find(p=>p.name===presetName); const root=preset?.[kind]?.path;
      if(!root) return json(res,404,{error:'source not configured'});
      const rel=String(url.searchParams.get('path')||'').replace(/\\/g,'/'); const target=path.resolve(root,...rel.split('/'));
      if(!isSubPath(root,target)||!fs.existsSync(target)||!fs.statSync(target).isFile()) return json(res,404,{error:'asset not found'});
      return serveFile(res,target);
    }

    if(url.pathname==='/api/library'&&req.method==='GET'){
      await fsp.mkdir(LIBDIR,{recursive:true});
      const items=[];
      const walk=async dir=>{
        let list; try{list=await fsp.readdir(dir,{withFileTypes:true});}catch{return;}
        for(const ent of list){
          const p=path.join(dir,ent.name);
          if(ent.isDirectory()) await walk(p);
          else{ const st=await fsp.stat(p); items.push({path:path.relative(LIBDIR,p).split(path.sep).join('/'),bytes:st.size,mtime:st.mtime.toISOString()}); }
        }
      };
      await walk(LIBDIR);
      return json(res,200,{ok:true,root:LIBDIR,items});
    }
    if(url.pathname==='/api/library'&&req.method==='POST'){
      const rel=String(url.searchParams.get('name')||'').split('/').map(s=>safeName(s)).filter(s=>s&&s!=='Default'||s==='Default').join('/');
      if(!rel) return json(res,400,{ok:false,error:'name query param required'});
      const target=path.resolve(LIBDIR,...rel.split('/'));
      if(!isSubPath(LIBDIR,target)) return json(res,400,{ok:false,error:'invalid path'});
      const bytes=await streamUpload(req,target);
      return json(res,200,{ok:true,path:rel,bytes});
    }
    if(url.pathname==='/api/library/file'&&req.method==='GET'){
      const rel=String(url.searchParams.get('path')||'').replace(/\\/g,'/');
      const target=path.resolve(LIBDIR,...rel.split('/').filter(Boolean));
      if(!isSubPath(LIBDIR,target)||!fs.existsSync(target)||!fs.statSync(target).isFile()) return json(res,404,{error:'library file not found'});
      return serveFile(res,target);
    }
    if(url.pathname==='/api/library'&&req.method==='DELETE'){
      const rel=String(url.searchParams.get('path')||'').replace(/\\/g,'/');
      const target=path.resolve(LIBDIR,...rel.split('/').filter(Boolean));
      if(!isSubPath(LIBDIR,target)) return json(res,400,{ok:false,error:'invalid path'});
      await fsp.rm(target,{force:true});
      return json(res,200,{ok:true,removed:rel});
    }

    let pathname=decodeURIComponent(url.pathname);
    if(pathname==='/') pathname='/demo/character-studio.html';
    const target=path.resolve(ROOT,'.'+pathname);
    if(!isSubPath(ROOT,target)||!fs.existsSync(target)||!fs.statSync(target).isFile()) return json(res,404,{error:'not found'});
    return serveFile(res,target);
  }catch(err){ console.error(err); if(!res.headersSent) json(res,500,{ok:false,error:String(err.message||err)}); else res.destroy(); }
});
server.listen(PORT,HOST,()=>{
  console.log(`CHARACTER STUDIO v4.1.1 local workspace: http://${HOST}:${PORT}/`);
  console.log(`Workspace: ${WORKSPACE}`);
});
