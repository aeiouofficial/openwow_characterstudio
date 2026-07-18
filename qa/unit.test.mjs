// Unit tests for engine internals — run with: node --test qa/
// Tests the SHIPPED code: functions are extracted from demo/character-studio.html and
// evaluated in a sandbox, so drift between tests and product is impossible.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const html=fs.readFileSync(path.join(__dirname,'../demo/character-studio.html'),'utf8');

function extract(name){
  // function declaration
  let i=html.indexOf('function '+name+'(');
  if(i>=0){
    let d=0;
    for(let k=html.indexOf('{',i);k<html.length;k++){
      if(html[k]==='{')d++;
      else if(html[k]==='}'){ d--; if(!d) return html.slice(i,k+1); }
    }
  }
  // const binding (balanced to trailing semicolon)
  i=html.indexOf('const '+name+'=');
  if(i>=0){
    let d=0;
    for(let k=i;k<html.length;k++){
      const c=html[k];
      if(c==='{'||c==='('||c==='[')d++;
      else if(c==='}'||c===')'||c===']')d--;
      else if(c===';'&&d===0) return html.slice(i,k+1);
    }
  }
  throw new Error(name+' not found in shipped HTML');
}

const ctx=vm.createContext({
  Math,Uint8Array,Uint16Array,Uint32Array,Int32Array,Float32Array,Float64Array,
  TextEncoder,TextDecoder,JSON,Array,Object,String,Number,Boolean,isFinite,parseInt,parseFloat,decodeURIComponent,Infinity,NaN,
});
for(const name of ['CRC_T','crc32','validateManifest','mulberry32','hexRgb','perspective','lookAt','mat4I','mul','normalizeAssetPath','companionTextureScore'])
  vm.runInContext(extract(name),ctx);
const call=(expr)=>vm.runInContext(expr,ctx);

test('crc32 matches the CRC-32 check value',()=>{
  ctx.__in=new TextEncoder().encode('123456789');
  const v=call('crc32(__in)>>>0');
  assert.equal(v,0xCBF43926); // canonical IEEE 802.3 check value
});

test('crc32 of empty input is 0',()=>{
  ctx.__in=new Uint8Array(0);
  assert.equal(call('crc32(__in)>>>0'),0);
});

test('mulberry32 is deterministic, bounded, and seed-sensitive',()=>{
  const a1=call('(()=>{const r=mulberry32(42);return [r(),r(),r()];})()');
  const a2=call('(()=>{const r=mulberry32(42);return [r(),r(),r()];})()');
  const b =call('(()=>{const r=mulberry32(43);return [r(),r(),r()];})()');
  assert.deepEqual(a1,a2);
  assert.notDeepEqual(a1,b);
  for(const v of a1){ assert.ok(v>=0&&v<1); }
});

test('validateManifest rejects garbage',()=>{
  const bad=call('validateManifest({})');
  assert.equal(bad.ok,false);
  assert.ok(bad.errors.length>0);
});

test('validateManifest accepts a real authored manifest (fixture)',t=>{
  const fx='/data/qa_pack_check/customization_manifest.json';
  if(!fs.existsSync(fx)) return t.skip('pack fixture not present on this machine');
  ctx.__m=JSON.parse(fs.readFileSync(fx,'utf8'));
  const res=call('validateManifest(__m)');
  assert.equal(res.ok,true,JSON.stringify(res.errors));
});

test('hexRgb decodes 6- and 3-digit colors',()=>{
  const r6=call("hexRgb('#ff0000')");
  assert.deepEqual(Array.from(r6),[1,0,0]); // Array.from: vm sandbox arrays are cross-realm
  const v=call("hexRgb('#888')");
  for(const c of v) assert.ok(Math.abs(c-0x88/255)<1e-9);
});

test('perspective builds a right-handed projection',()=>{
  const p=call('(()=>{const m=new Float32Array(16);perspective(m,Math.PI/4,16/9,0.1,100);return Array.from(m);})()');
  assert.ok(Math.abs(p[5]-1/Math.tan(Math.PI/8))<1e-6); // f on Y
  assert.ok(Math.abs(p[0]-p[5]/(16/9))<1e-6);           // aspect on X
  assert.equal(p[11],-1);                                // perspective divide
});

test('lookAt uses the fixed +Y up-vector (v1.2 sideways-bug regression)',()=>{
  const m=call('(()=>{const m=new Float32Array(16);lookAt(m,0,0,5,0,0,0);return Array.from(m);})()');
  assert.ok(Math.abs(m[14]-(-5))<1e-6); // eye distance on -Z
  assert.ok(Math.abs(m[5]-1)<1e-6);     // Y stays up
  assert.ok(Math.abs(m[0]-1)<1e-6);     // X stays right
});

test('mat4I × M = M (mul identity)',()=>{
  const same=call('(()=>{const a=mat4I();const b=new Float32Array(16);for(let i=0;i<16;i++)b[i]=i+1;const o=new Float32Array(b);mul(o,a,b);return Array.from(o).every((v,i)=>Math.abs(v-b[i])<1e-6);})()');
  assert.equal(same,true);
});


test('asset path normalization matches ZIP, drag/drop, and glTF URI lookups',()=>{
  ctx.__path='./Textures\\Human%20Male.PNG?cache=1';
  assert.equal(call('normalizeAssetPath(__path)'),'textures/human male.png');
});

test('companion base-texture ranking prefers the conventional _texture_1 name',()=>{
  ctx.__model={name:'humanmale_hd.glb'};
  ctx.__exact={name:'humanmale_hd_texture_1.png'};
  ctx.__other={name:'humanmale_hd_normal.png'};
  assert.equal(call('companionTextureScore(__model,__exact)'),100);
  assert.equal(call('companionTextureScore(__model,__other)'),0);
});
