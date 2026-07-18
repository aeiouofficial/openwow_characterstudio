// Visual regression: screenshots vs golden images, pure-Node PNG diff (no deps beyond Playwright).
// Usage:
//   node qa/visual-regression.mjs --update     regenerate goldens
//   node qa/visual-regression.mjs              compare (exit 1 on drift)
// Env: CS_TEST_MODEL (optional) adds a model-loaded scene; CHROMIUM_PATH.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const GOLDEN=path.join(__dirname,'golden');
const OUT=path.join(__dirname,'current');
const UPDATE=process.argv.includes('--update');
const CHANNEL_TOL=12;      // per-channel delta considered "same"
const MAX_DIFF_RATIO=0.01; // fail if >1% of pixels differ

function decodePng(buf){
  if(buf.readUInt32BE(0)!==0x89504e47) throw new Error('not a PNG');
  let p=8, w=0,h=0,bitDepth=0,colorType=0; const idat=[];
  while(p<buf.length){
    const len=buf.readUInt32BE(p); const type=buf.toString('ascii',p+4,p+8);
    if(type==='IHDR'){ w=buf.readUInt32BE(p+8); h=buf.readUInt32BE(p+12); bitDepth=buf[p+16]; colorType=buf[p+17];
      if(bitDepth!==8||(colorType!==6&&colorType!==2)||buf[p+20]!==0) throw new Error(`unsupported PNG (depth ${bitDepth}, color ${colorType})`); }
    else if(type==='IDAT') idat.push(buf.subarray(p+8,p+8+len));
    else if(type==='IEND') break;
    p+=12+len;
  }
  const bpp=colorType===6?4:3;
  const raw=zlib.inflateSync(Buffer.concat(idat));
  const stride=w*bpp;
  const out=Buffer.alloc(w*h*4);
  const prev=Buffer.alloc(stride);
  for(let y=0;y<h;y++){
    const f=raw[y*(stride+1)];
    const row=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1));
    for(let x=0;x<stride;x++){
      const a=x>=bpp?row[x-bpp]:0, b=prev[x], c=x>=bpp?prev[x-bpp]:0;
      let v=row[x];
      if(f===1) v=(v+a)&255;
      else if(f===2) v=(v+b)&255;
      else if(f===3) v=(v+((a+b)>>1))&255;
      else if(f===4){ const pa=Math.abs(b-c),pb=Math.abs(a-c),pc=Math.abs(a+b-2*c); v=(v+(pa<=pb&&pa<=pc?a:pb<=pc?b:c))&255; }
      row[x]=v;
    }
    row.copy(prev);
    for(let x=0;x<w;x++){
      out[(y*w+x)*4]=row[x*bpp]; out[(y*w+x)*4+1]=row[x*bpp+1];
      out[(y*w+x)*4+2]=row[x*bpp+2]; out[(y*w+x)*4+3]=bpp===4?row[x*bpp+3]:255;
    }
  }
  return {w,h,data:out};
}
function diffPng(aBuf,bBuf){
  const A=decodePng(aBuf), B=decodePng(bBuf);
  if(A.w!==B.w||A.h!==B.h) return {ratio:1,reason:`size ${A.w}x${A.h} vs ${B.w}x${B.h}`};
  let bad=0; const n=A.w*A.h;
  for(let i=0;i<n;i++){
    const o=i*4;
    if(Math.abs(A.data[o]-B.data[o])>CHANNEL_TOL||Math.abs(A.data[o+1]-B.data[o+1])>CHANNEL_TOL||Math.abs(A.data[o+2]-B.data[o+2])>CHANNEL_TOL) bad++;
  }
  return {ratio:bad/n};
}

const APP='file://'+path.resolve(process.env.CS_APP||path.join(__dirname,'../demo/character-studio.html'));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/local/bin/chromium',args:['--use-gl=angle','--enable-unsafe-swiftshader','--force-device-scale-factor=1']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
await page.goto(APP);
await page.waitForFunction('window.__studioReady===true');
// mask nondeterministic HUD bits (fps counter)
await page.addStyleTag({content:'#hudFps{visibility:hidden!important}'});

const scenes=[{id:'empty-state',prep:async()=>{}}];
if(process.env.CS_TEST_MODEL) scenes.push({id:'model-loaded',prep:async()=>{
  await page.setInputFiles('#fileModel',process.env.CS_TEST_MODEL);
  await page.waitForFunction(()=>/Loaded|wired/.test(document.getElementById('status').textContent),null,{timeout:180000});
  await page.evaluate(()=>{ StudioAPI.pauseAnimation&&StudioAPI.pauseAnimation(); });
  await page.waitForTimeout(600);
}});

fs.mkdirSync(GOLDEN,{recursive:true}); fs.mkdirSync(OUT,{recursive:true});
let failures=0;
for(const sc of scenes){
  await sc.prep();
  await page.waitForTimeout(300);
  const shot=await page.screenshot();
  const goldenPath=path.join(GOLDEN,sc.id+'.png');
  if(UPDATE||!fs.existsSync(goldenPath)){
    fs.writeFileSync(goldenPath,shot);
    console.log(`[golden ${UPDATE?'updated':'created'}] ${sc.id}`);
  }else{
    fs.writeFileSync(path.join(OUT,sc.id+'.png'),shot);
    const d=diffPng(fs.readFileSync(goldenPath),shot);
    const pct=(d.ratio*100).toFixed(3);
    const ok=d.ratio<=MAX_DIFF_RATIO;
    console.log(`[${ok?'PASS':'FAIL'}] ${sc.id}: ${pct}% pixels differ${d.reason?' ('+d.reason+')':''}`);
    if(!ok) failures++;
  }
}
await browser.close();
process.exit(failures?1:0);
