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
for(const name of ['CRC_T','crc32','validateManifest','mulberry32','hexRgb','perspective','lookAt','mat4I','mul','normalizeAssetPath','companionTextureScore','defaultUvLayer','defaultEyeFine','defaultGeosetTextureTransform','cloneJson','normalizeUvLayer','normalizeGeosetTextureTransform','near','layerIsDefault','isDefaultUvTransform','combinedEyeLayer','SAFE_DEFAULT_DECORATION_RE','SAFE_DEFAULT_VARIANTS','groupKey','choosePreferredGeoset','normalizeGeosetDefaults','setGeosetGroupVisibility','applyUvPreviewDrag'])
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


test('default geoset texture transform is shader-identity',()=>{
  assert.equal(call('isDefaultUvTransform(defaultGeosetTextureTransform())'),true);
});

test('UV transform normalization clamps unsafe scales and eye feather',()=>{
  ctx.__uv={full:{scaleX:0,scaleY:-2},eyes:{enabled:true,width:0,height:-0.2,feather:5}};
  const out=call('normalizeGeosetTextureTransform(__uv)');
  assert.equal(out.full.scaleX,0.01);
  assert.equal(out.full.scaleY,2);
  assert.equal(out.eyes.width,0.005);
  assert.equal(out.eyes.height,0.2);
  assert.equal(out.eyes.feather,0.95);
});

test('eye pair and per-eye fine transforms compose predictably',()=>{
  ctx.__pair={...call('defaultEyeFine()'),offsetX:0.1,scaleX:1.5,rotation:8};
  ctx.__fine={...call('defaultEyeFine()'),offsetX:-0.02,scaleX:0.8,rotation:-3};
  const out=call('combinedEyeLayer(__pair,__fine)');
  assert.ok(Math.abs(out.offsetX-0.08)<1e-9);
  assert.ok(Math.abs(out.scaleX-1.2)<1e-9);
  assert.equal(out.rotation,5);
});

test('shipped shader transforms all material texture channels with mapped UVs',()=>{
  assert.match(html,/vec2 sampleUv=mappedUv\(vUv\)/);
  for(const sampler of ['uTex','uMR','uNorm','uOcc','uEmis']) assert.match(html,new RegExp(`texture\\(${sampler},(?:uv|sampleUv)\\)`));
  assert.match(html,/characterStudioTextureTransform/);
});


test('safe model defaults never stack variant subsets',()=>{
  ctx.__geo=[
    {name:'orc_hd_Geoset0',group:'Geoset',variant:0,mode:'body',isGear:false,authoredDefaultVisible:null},
    {name:'orc_hd_HeadSwap1',group:'HeadSwap',variant:1,mode:'head',isGear:false,authoredDefaultVisible:null},
    {name:'orc_hd_HeadSwap2',group:'HeadSwap',variant:2,mode:'head',isGear:false,authoredDefaultVisible:null},
    {name:'orc_hd_HeadPreset1',group:'HeadPreset',variant:1,mode:'head',isGear:false,authoredDefaultVisible:null},
    {name:'orc_hd_Eyes1',group:'Eyes',variant:1,mode:'head',isGear:false,authoredDefaultVisible:null},
    {name:'orc_hd_Eyes2',group:'Eyes',variant:2,mode:'head',isGear:false,authoredDefaultVisible:null},
    {name:'orc_hd_Ears1',group:'Ears',variant:1,mode:'head',isGear:false,authoredDefaultVisible:null},
    {name:'orc_hd_Ears2',group:'Ears',variant:2,mode:'head',isGear:false,authoredDefaultVisible:null},
    {name:'orc_hd_Hair1',group:'Hair',variant:1,mode:'head',isGear:false,authoredDefaultVisible:true},
    {name:'orc_hd_Hair2',group:'Hair',variant:2,mode:'head',isGear:false,authoredDefaultVisible:true},
    {name:'orc_hd_Boots1',group:'Boots',variant:1,mode:'none',isGear:true,authoredDefaultVisible:true},
    {name:'orc_hd_Torso1',group:'Torso',variant:1,mode:'body',isGear:false,authoredDefaultVisible:true},
  ];
  const out=call('normalizeGeosetDefaults(__geo)');
  const visible=out.filter(g=>g.visible).map(g=>g.name);
  assert.ok(visible.includes('orc_hd_Geoset0'));
  assert.ok(visible.includes('orc_hd_HeadSwap2'));
  assert.ok(visible.includes('orc_hd_Eyes1'));
  assert.ok(visible.includes('orc_hd_Ears2'));
  assert.equal(visible.some(n=>/Hair|Boots|Torso|HeadPreset/.test(n)),false);
  for(const group of new Set(out.map(g=>g.group))){
    assert.ok(out.filter(g=>g.group===group&&g.visible).length<=1,group+' has overlapping defaults');
  }
});

test('subset visibility helpers support all on, all off, and safe default',()=>{
  ctx.__group=[{visible:false,defaultVisible:true},{visible:true,defaultVisible:false}];
  call("setGeosetGroupVisibility(__group,'on')");
  assert.deepEqual(Array.from(ctx.__group,v=>v.visible),[true,true]);
  call("setGeosetGroupVisibility(__group,'off')");
  assert.deepEqual(Array.from(ctx.__group,v=>v.visible),[false,false]);
  call("setGeosetGroupVisibility(__group,'default')");
  assert.deepEqual(Array.from(ctx.__group,v=>v.visible),[true,false]);
});

test('eye-pair preview drag moves eye texture, while shift-drag moves masks',()=>{
  ctx.__cfg=call('defaultGeosetTextureTransform()');
  ctx.__start=JSON.parse(JSON.stringify(ctx.__cfg));
  call("applyUvPreviewDrag('eyes',__cfg,__start,0.1,-0.05,false)");
  assert.ok(Math.abs(ctx.__cfg.eyes.pair.offsetX-0.1)<1e-9);
  assert.ok(Math.abs(ctx.__cfg.eyes.pair.offsetY+0.05)<1e-9);
  assert.equal(ctx.__cfg.eyes.centerX,0.5);
  ctx.__cfg=call('defaultGeosetTextureTransform()');ctx.__start=JSON.parse(JSON.stringify(ctx.__cfg));
  call("applyUvPreviewDrag('eyes',__cfg,__start,0.1,-0.05,true)");
  assert.ok(Math.abs(ctx.__cfg.eyes.centerX-0.6)<1e-9);
  assert.ok(Math.abs(ctx.__cfg.eyes.centerY-0.45)<1e-9);
  assert.equal(ctx.__cfg.eyes.pair.offsetX,0);
});

test('Firefox range styling and per-subset controls ship in the UI',()=>{
  assert.match(html,/::-moz-range-thumb/);
  assert.match(html,/class=\"grp-actions\"/);
  assert.match(html,/Shift-drag moves the mask pair/);
});

/* ───────── v4.1.1 — backdrop, library, and Machinima Studio Elite ───────── */
ctx.Date=Date;
for(const name of ['csChromaPresetColor','csResolveBackground','csCoverScale','orthographic','spriteSheetYaws','csNormalizeFx','csDefaultScene','csNormalizeScene','validateLibraryRecord'])
  vm.runInContext(extract(name),ctx);

test('chroma preset palette matches the approved keying colors',()=>{
  assert.equal(call('csChromaPresetColor("chromaGreen")'),'#00B140');
  assert.equal(call('csChromaPresetColor("chromaGreenPure")'),'#00FF00');
  assert.equal(call('csChromaPresetColor("chromaBlue")'),'#0047BB');
  assert.equal(call('csChromaPresetColor("chromaBluePure")'),'#0000FF');
  assert.equal(call('csChromaPresetColor("chromaMagenta")'),'#FF00FF');
  assert.equal(call('csChromaPresetColor("nonsense")'),null);
});

test('csResolveBackground maps every mode to the right clear behavior',()=>{
  assert.equal(call('csResolveBackground("transparent").type'),'transparent');
  assert.deepEqual(Array.from(call('csResolveBackground("studio",null,null,0).rgba')),[0,0,0,1]);
  assert.deepEqual(Array.from(call('csResolveBackground("chromaGreenPure").rgba')),[0,1,0,1]);
  assert.deepEqual(Array.from(call('csResolveBackground("chromaBluePure").rgba')),[0,0,1,1]);
  const grad=call('csResolveBackground("gradient","#ffffff","#000000")');
  assert.equal(grad.type,'gradient');
  assert.deepEqual(Array.from(grad.rgba).slice(0,3),[1,1,1]);
  assert.deepEqual(Array.from(grad.rgba2).slice(0,3),[0,0,0]);
  const custom=call('csResolveBackground("custom","#ff0000")');
  assert.deepEqual(Array.from(custom.rgba).slice(0,3),[1,0,0]);
  assert.equal(call('csResolveBackground("image").type'),'image');
  const g18=call('csResolveBackground("gray18").rgba[0]'), g50=call('csResolveBackground("gray50").rgba[0]');
  assert.ok(g18>0.4&&g18<0.5); assert.ok(Math.abs(g50-128/255)<1e-9);
});

test('orthographic projection maps the view box to NDC corners',()=>{
  ctx.__m=new Float32Array(16);
  call('orthographic(__m,2,1,0.05,50)');
  const m=ctx.__m;
  // x=halfW -> ndc 1, y=halfH -> ndc 1
  assert.ok(Math.abs(m[0]*2-1)<1e-6);
  assert.ok(Math.abs(m[5]*1-1)<1e-6);
  // z=-near -> -1, z=-far -> +1 (column-major: ndcZ = m[10]*z + m[14])
  assert.ok(Math.abs((m[10]*-0.05+m[14])+1)<1e-6);
  assert.ok(Math.abs((m[10]*-50+m[14])-1)<1e-6);
  assert.equal(m[11],0); // no perspective divide term
});

test('spriteSheetYaws produces an even clockwise turnaround from the base yaw',()=>{
  const y=Array.from(call('spriteSheetYaws(8,0.5)'));
  assert.equal(y.length,8);
  assert.ok(Math.abs(y[0]-0.5)<1e-9);
  for(let i=1;i<8;i++) assert.ok(Math.abs((y[i]-y[i-1])-Math.PI/4)<1e-9);
  assert.ok(Math.abs((y[7]+Math.PI/4)-(0.5+Math.PI*2))<1e-9);
  assert.equal(call('spriteSheetYaws(0).length'),1);
});

test('csNormalizeFx clamps rasterize and posterize into safe ranges',()=>{
  const fx=call('csNormalizeFx({fxPixelate:99,fxPosterize:1,fxDither:1,fxOutline:0,fxOutlineThreshold:9})');
  assert.equal(fx.pixelate,16);
  assert.equal(fx.posterize,0); // 1 level is meaningless -> off
  assert.equal(fx.dither,true);
  assert.equal(fx.outline,false);
  assert.ok(fx.outlineThreshold<=0.05);
  const lo=call('csNormalizeFx({fxPixelate:0,fxPosterize:4.4})');
  assert.equal(lo.pixelate,1);
  assert.equal(lo.posterize,4);
  assert.equal(call('csNormalizeFx().pixelate'),1);
});

test('scene state defaults to a keyable greenscreen room and survives garbage input',()=>{
  const d=call('csDefaultScene()');
  assert.deepEqual(Object.keys(d.faces).sort(),['ceiling','east','floor','north','south','west']);
  assert.equal(d.chroma,'green');
  assert.equal(d.markers,true);
  for(const k of Object.keys(d.faces)) assert.equal(d.faces[k].media,'chroma');
  const s=call('csNormalizeScene({enabled:1,chroma:"purple",markerTiles:999,sizeMul:-3,faces:{floor:{media:"hologram"},north:{media:"video",name:"clip.mp4",sourceId:"face-1",mime:"video/mp4"}},sky:{enabled:"yes",name:"sky.hdr",sourceId:"sky-1",mime:"image/jpeg"}})');
  assert.equal(s.enabled,true);
  assert.equal(s.chroma,'green');
  assert.equal(s.markerTiles,20);
  assert.ok(s.sizeMul>=1.05);
  assert.equal(s.faces.floor.media,'chroma');
  assert.equal(s.faces.north.media,'video');
  assert.equal(s.faces.north.name,'clip.mp4');
  assert.equal(s.sky.enabled,true);
  assert.equal(s.sky.name,'sky.hdr');
  assert.equal(s.sky.sourceId,'sky-1');
  assert.equal(s.sky.mime,'image/jpeg');
  assert.equal(s.faces.north.sourceId,'face-1');
  assert.equal(s.faces.north.mime,'video/mp4');
  assert.equal(call('csNormalizeScene(null).chroma'),'green');
});

test('validateLibraryRecord accepts real records and rejects malformed ones',()=>{
  const ok=call('validateLibraryRecord({id:"abcd-1234",type:"appearance",name:"Orc hero",createdAt:"2026-07-18T20:00:00.000Z",json:"{}"})');
  assert.equal(ok.ok,true);
  assert.equal(ok.errors.length,0);
  for(const type of ['character','machinima','audio','video']){
    const rec=call(`validateLibraryRecord({id:"abcd-${type}",type:"${type}",name:"Asset",createdAt:"2026-07-18T20:00:00.000Z",json:"{}"})`);
    assert.equal(rec.ok,true,type);
  }
  const bad=call('validateLibraryRecord({id:"x",type:"malware",name:"",createdAt:"not a date"})');
  assert.equal(bad.ok,false);
  assert.ok(bad.errors.length>=4);
  assert.equal(call('validateLibraryRecord(null).ok'),false);
});

test('csCoverScale crops (never letterboxes) for cover-fit backdrops',()=>{
  const wide=call('csCoverScale(2,1)');  // wide image, square view
  assert.equal(wide[1],1); assert.ok(Math.abs(wide[0]-0.5)<1e-9);
  const tall=call('csCoverScale(0.5,1)');
  assert.equal(tall[0],1); assert.ok(Math.abs(tall[1]-0.5)<1e-9);
  assert.deepEqual(Array.from(call('csCoverScale(NaN,-1)')),[1,1]);
});

test('v4.2.1 alpha matte transparency and prior workspace features ship in the HTML',()=>{
  assert.match(html,/alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true/);
  assert.match(html,/Scene Studio \(Chroma Room\)/);
  assert.match(html,/'Asset Library'/);
  assert.match(html,/'Capture & Export'/);
  assert.match(html,/'Backdrop & Post FX'/);
  assert.match(html,/id="btnLibraryWorkspace"/);
  assert.match(html,/id="btnSceneStudioWorkspace"/);
  assert.match(html,/id="btnSaveCharacterLibrary"/);
  assert.match(html,/async function csSaveCurrentCharacterAsset/);
  assert.match(html,/async function csLoadCharacterLibraryRecord/);
  assert.match(html,/studio\/character_state\.json/);
  assert.match(html,/type==='character'/);
  assert.match(html,/Character Studio visual-system unification/);
  assert.match(html,/id="workspaceLayer"/);
  assert.match(html,/id="csSceneCanvasDock"/);
  assert.match(html,/data-view="grid"/);
  assert.match(html,/previewBlob/);
  assert.match(html,/csLibrarySearchTimer/);
  assert.match(html,/data-bgmode/);
  assert.match(html,/uMarkerColor/);      // tracking-point shader
  assert.match(html,/uPosterize/);        // post FX shader
  assert.match(html,/csShotAlpha/);       // transparent PNG button
  assert.match(html,/#gl\.cs-alpha/);     // transparency checkerboard CSS
  assert.match(html,/character-studio_v4\.2\.1/);
  assert.match(html,/a\.background=/);    // appearance JSON carries backdrop state
  assert.match(html,/a\.scene=/);         // appearance JSON carries scene state
  assert.match(html,/Machinima Studio/);
  assert.match(html,/cs-pro-timeline/);
  assert.match(html,/CS_V4_TRACK_TYPES/);
  assert.match(html,/music:\{label:'Music'/);
  assert.match(html,/dialogue:\{label:'Dialogue \/ Voice'/);
  assert.match(html,/function csV4AddCameraKey/);
  assert.match(html,/function csV4SplitClip/);
  assert.match(html,/function csV4SnapTime/);
  assert.match(html,/function csV4RippleDeleteSelection/);
  assert.match(html,/function csV4ParseTimecode/);
  assert.match(html,/id="csProMarkIn"/);
  assert.match(html,/function csV4StartExport/);
  assert.match(html,/navigator\.mediaDevices\?\.getUserMedia/);
  assert.match(html,/CS_V41_BUNDLE_FORMAT/);
  assert.match(html,/character-studio\/machinima-bundle/);
  assert.match(html,/function csV41DownloadBundle/);
  assert.match(html,/CS_V42_VERSION='4\.2\.1'/);
  assert.match(html,/cs-ux-commandbar/);
  assert.match(html,/function csV42SetLayout/);
  assert.match(html,/function csV42Accordions/);
  assert.match(html,/function csV42ShowCommands/);
  assert.match(html,/cs-ux-resizer/);
  assert.match(html,/cs-main-panel-head/);
  assert.match(html,/function csV42EnhanceMainPanel/);
  assert.match(html,/cs-main-resizer/);
  assert.match(html,/window\.StudioAPI\.panels/);

  assert.match(html,/function csV41InsertAsset/);
  assert.match(html,/application\/x-character-studio-asset/);
  assert.match(html,/mode:'slip'/);
  assert.match(html,/createStereoPanner/);
  assert.match(html,/id=\"v41FitTimeline\"/);
  assert.match(html,/id=\"v41Follow\"/);
  assert.match(html,/id=\"v41RenderResolution\"/);
  assert.match(html,/data-v41-cam-pos/);
  assert.match(html,/panX/);
  assert.match(html,/panZ/);
  assert.match(html,/\.json,\.zip,application\/json,application\/zip/);
  assert.match(html,/machinima:\{getProject/);
  assert.doesNotMatch(html,/window\.StudioAPI\.version='3\.3\.0'/);
});
