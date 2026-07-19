#!/usr/bin/env node
// MCP stdio server — exposes Character Studio's StudioAPI as MCP tools.
// Protocol: JSON-RPC 2.0, one message per line on stdin/stdout (MCP stdio transport).
// Env: CS_APP (path to demo html), CHROMIUM_PATH.
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const APP='file://'+path.resolve(process.env.CS_APP||path.join(__dirname,'../demo/character-studio.html'));
let browser=null, page=null;

async function ensurePage(){
  if(page) return page;
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/local/bin/chromium',args:['--use-gl=angle','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:1280,height:800}});
  await page.goto(APP);
  await page.waitForFunction('window.__studioReady===true',null,{timeout:60000});
  return page;
}

const TOOLS=[
  {name:'load_model',description:'Load a .glb/.gltf model or .zip content pack from an absolute file path.',inputSchema:{type:'object',properties:{path:{type:'string',description:'absolute file path'}},required:['path']}},
  {name:'get_appearance',description:'Get the full appearance state (morphs, geosets, colors, equipped textures) as JSON.',inputSchema:{type:'object',properties:{}}},
  {name:'apply_appearance',description:'Apply an appearance JSON (as produced by get_appearance).',inputSchema:{type:'object',properties:{appearance:{type:'string',description:'appearance JSON string'}},required:['appearance']}},
  {name:'list_geosets',description:'List geosets with group and visibility.',inputSchema:{type:'object',properties:{}}},
  {name:'set_geoset',description:'Show or hide a geoset by exact name.',inputSchema:{type:'object',properties:{name:{type:'string'},visible:{type:'boolean'}},required:['name','visible']}},
  {name:'list_animations',description:'List animation clips with duration.',inputSchema:{type:'object',properties:{}}},
  {name:'play_animation',description:'Play an animation clip by index (crossfades from the current clip).',inputSchema:{type:'object',properties:{index:{type:'number'}},required:['index']}},
  {name:'get_anim_state',description:'Get playback state: clip, time, speed, loop, bone count, pose hash.',inputSchema:{type:'object',properties:{}}},
  {name:'randomize',description:'Randomize the character appearance.',inputSchema:{type:'object',properties:{}}},
  {name:'screenshot',description:'Render the current viewport and return a PNG image.',inputSchema:{type:'object',properties:{}}},
  {name:'save_project',description:'Save the current state as a named project (IndexedDB).',inputSchema:{type:'object',properties:{name:{type:'string'}},required:['name']}},
  {name:'list_projects',description:'List saved projects.',inputSchema:{type:'object',properties:{}}},
  {name:'export_glb',description:'Export the customized character as GLB (baked morphs, hidden geosets stripped) to an absolute output path.',inputSchema:{type:'object',properties:{path:{type:'string'},includeHidden:{type:'boolean'}},required:['path']}},
  {name:'build_pack',description:'Author a content pack zip (manifest, textures, SHA256SUMS) to an absolute output path.',inputSchema:{type:'object',properties:{path:{type:'string'},name:{type:'string'},version:{type:'string'},includeModel:{type:'boolean'}},required:['path']}},
];

async function pullExportToFile(p,outPath){
  // window.__csExportBytes must be set in page; stream out in 8 MB base64 chunks
  const size=await p.evaluate(()=>window.__csExportBytes.length);
  fs.writeFileSync(outPath,Buffer.alloc(0));
  const CHUNK=8*1024*1024;
  for(let o=0;o<size;o+=CHUNK){
    const b64=await p.evaluate(([o,c])=>{ let s=''; const b=window.__csExportBytes.subarray(o,o+c); for(let i=0;i<b.length;i+=32768) s+=String.fromCharCode.apply(null,b.subarray(i,i+32768)); return btoa(s); },[o,CHUNK]);
    fs.appendFileSync(outPath,Buffer.from(b64,'base64'));
  }
  await p.evaluate(()=>{ delete window.__csExportBytes; });
  return size;
}
const text=o=>({content:[{type:'text',text:typeof o==='string'?o:JSON.stringify(o)}]});

async function callTool(name,args){
  const p=await ensurePage();
  switch(name){
    case 'load_model':{
      if(!fs.existsSync(args.path)) throw new Error('file not found: '+args.path);
      await p.setInputFiles('#fileModel',args.path);
      await p.waitForFunction(()=>/Loaded|wired/.test(document.getElementById('status').textContent),null,{timeout:180000});
      return text(await p.evaluate(()=>StudioAPI.getStatus()));
    }
    case 'get_appearance': return text(await p.evaluate(()=>JSON.stringify(StudioAPI.getAppearance())));
    case 'apply_appearance': return text({ok:await p.evaluate(a=>StudioAPI.applyAppearance(a),args.appearance)});
    case 'list_geosets': return text(await p.evaluate(()=>StudioAPI.listGeosets()));
    case 'set_geoset': return text({ok:await p.evaluate(([n,v])=>StudioAPI.setGeosetVisible(n,v),[args.name,args.visible])});
    case 'list_animations': return text(await p.evaluate(()=>StudioAPI.listAnimations()));
    case 'play_animation': return text(await p.evaluate(i=>StudioAPI.playAnimation(i),args.index));
    case 'get_anim_state': return text(await p.evaluate(()=>StudioAPI.getAnimState()));
    case 'randomize': return text({ok:await p.evaluate(()=>{ document.getElementById('btnRandom')?.click(); return true; })});
    case 'screenshot':{
      const durl=await p.evaluate(()=>document.getElementById('gl').toDataURL('image/png'));
      return {content:[{type:'image',data:durl.split(',')[1],mimeType:'image/png'}]};
    }
    case 'save_project': return text(await p.evaluate(n=>StudioAPI.saveProject(n),args.name));
    case 'list_projects': return text(await p.evaluate(()=>StudioAPI.listProjects()));
    case 'export_glb':{
      const meta=await p.evaluate(o=>{ const r=StudioAPI.exportGlb(o); window.__csExportBytes=window.__glbExport; return r; },{includeHidden:!!args.includeHidden});
      const size=await pullExportToFile(p,args.path);
      return text({...meta,written:size,path:args.path});
    }
    case 'build_pack':{
      const meta=await p.evaluate(async o=>{ const r=await StudioAPI.buildPack(o); window.__csExportBytes=r.bytes; return {zipName:r.zipName,files:r.files.length}; },
        {name:args.name||'character_pack',version:args.version||'1.0.0',includeModel:!!args.includeModel,includeTextures:true,includePreview:true});
      const size=await pullExportToFile(p,args.path);
      return text({...meta,written:size,path:args.path});
    }
    default: throw new Error('unknown tool: '+name);
  }
}

function send(m){ process.stdout.write(JSON.stringify(m)+'\n'); }
async function handle(line){
  let msg; try{ msg=JSON.parse(line); }catch{ return send({jsonrpc:'2.0',id:null,error:{code:-32700,message:'parse error'}}); }
  const {id,method,params}=msg;
  try{
    if(method==='initialize') return send({jsonrpc:'2.0',id,result:{protocolVersion:(params&&params.protocolVersion)||'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'character-studio',version:'4.2.0'}}});
    if(method&&method.startsWith('notifications/')) return;
    if(method==='ping') return send({jsonrpc:'2.0',id,result:{}});
    if(method==='tools/list') return send({jsonrpc:'2.0',id,result:{tools:TOOLS}});
    if(method==='tools/call'){
      try{ return send({jsonrpc:'2.0',id,result:await callTool(params.name,params.arguments||{})}); }
      catch(e){ return send({jsonrpc:'2.0',id,result:{content:[{type:'text',text:'Error: '+(e&&e.message||e)}],isError:true}}); }
    }
    send({jsonrpc:'2.0',id,error:{code:-32601,message:'method not found: '+method}});
  }catch(e){ send({jsonrpc:'2.0',id,error:{code:-32000,message:String(e&&e.message||e)}}); }
}
let buf='';
process.stdin.setEncoding('utf8');
process.stdin.on('data',d=>{ buf+=d; let i; while((i=buf.indexOf('\n'))>=0){ const line=buf.slice(0,i).trim(); buf=buf.slice(i+1); if(line) handle(line); } });
process.stdin.on('end',async()=>{ try{ if(browser) await browser.close(); }catch{} process.exit(0); });
