// Protocol test for qa/mcp-server.mjs — spawns the server over stdio and drives it as an MCP client.
// Usage: node qa/mcp-test.mjs [model.glb]
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const MODEL=process.argv[2]||process.env.CS_TEST_MODEL;

const srv=spawn(process.execPath,[path.join(__dirname,'mcp-server.mjs')],{stdio:['pipe','pipe','inherit']});
const pending=new Map(); let nextId=1, rbuf='';
srv.stdout.setEncoding('utf8');
srv.stdout.on('data',d=>{ rbuf+=d; let i; while((i=rbuf.indexOf('\n'))>=0){ const line=rbuf.slice(0,i).trim(); rbuf=rbuf.slice(i+1); if(!line) continue;
  try{ const m=JSON.parse(line); if(m.id!=null&&pending.has(m.id)){ pending.get(m.id)(m); pending.delete(m.id); } }catch(e){ console.error('bad line',line.slice(0,120)); } } });
function rpc(method,params,timeoutMs=240000){
  const id=nextId++;
  return new Promise((res,rej)=>{
    const t=setTimeout(()=>{ pending.delete(id); rej(new Error('timeout: '+method)); },timeoutMs);
    pending.set(id,m=>{ clearTimeout(t); m.error?rej(new Error(m.error.message)):res(m.result); });
    srv.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
  });
}
const r={};
try{
  const init=await rpc('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'qa',version:'1.0'}});
  r.serverName=init.serverInfo.name; r.protocol=init.protocolVersion;
  srv.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
  const tl=await rpc('tools/list',{});
  r.toolCount=tl.tools.length;
  r.toolNames=tl.tools.map(t=>t.name);
  r.schemasOk=tl.tools.every(t=>t.inputSchema&&t.inputSchema.type==='object'&&typeof t.description==='string');
  if(MODEL){
    const load=await rpc('tools/call',{name:'load_model',arguments:{path:MODEL}});
    r.loaded=/Loaded|wired/.test(load.content[0].text);
    const anims=JSON.parse((await rpc('tools/call',{name:'list_animations',arguments:{}})).content[0].text);
    r.animCount=anims.length;
    await rpc('tools/call',{name:'play_animation',arguments:{index:0}});
    await new Promise(w=>setTimeout(w,700));
    const st=JSON.parse((await rpc('tools/call',{name:'get_anim_state',arguments:{}})).content[0].text);
    r.playing=st.playing===true; r.bones=st.boneCount;
    const shot=await rpc('tools/call',{name:'screenshot',arguments:{}});
    r.imageOk=shot.content[0].type==='image'&&shot.content[0].data.length>10000;
    const bad=await rpc('tools/call',{name:'load_model',arguments:{path:'/nonexistent.glb'}});
    r.errorHandled=bad.isError===true;
  }
  console.log(JSON.stringify(r,null,1));
  const ok=r.serverName==='character-studio'&&r.toolCount===14&&r.schemasOk&&(!MODEL||(r.loaded&&r.playing&&r.imageOk&&r.errorHandled));
  srv.stdin.end();
  setTimeout(()=>process.exit(ok?0:1),1500);
}catch(e){
  console.error('MCP test failed:',e.message);
  srv.kill();
  process.exit(1);
}
