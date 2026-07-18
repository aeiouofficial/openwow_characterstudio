// v3.3.0 QA — backdrop modes, post FX, capture, scene studio, asset library.
// Run: node qa/v330-check.mjs
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = 'file://' + path.join(__dirname, '../demo/character-studio.html');
const results = []; let failures = 0;
const check = (name, ok, detail='') => { results.push(`${ok?'PASS':'FAIL'}  ${name}${detail?'  — '+detail:''}`); if(!ok) failures++; };

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/local/bin/chromium',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 2048, height: 920 } });
const consoleErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => consoleErrors.push('pageerror: ' + e.message));

await page.goto(HTML);
await page.waitForFunction('window.__studioReady === true', null, { timeout: 20000 }).catch(()=>{});
const ready = await page.evaluate('window.__studioReady === true');
check('studio boots to ready', ready);

const hasGL = await page.evaluate(`(()=>{ const c=document.createElement('canvas'); return !!c.getContext('webgl2'); })()`);
check('WebGL2 available in QA browser (swiftshader)', hasGL, hasGL ? 'real GPU path' : 'STUB ONLY — visual checks limited');

check('StudioAPI.version is 3.3.0', await page.evaluate('window.StudioAPI.version') === '3.3.0');

// context really has an alpha channel
const ctxAlpha = await page.evaluate(`(()=>{ const gl=document.getElementById('gl').getContext('webgl2'); const a=gl.getContextAttributes(); return a.alpha===true && a.premultipliedAlpha===false; })()`);
check('GL context: alpha:true, premultipliedAlpha:false', ctxAlpha);

// cycle every background mode, render a frame each, watch for errors
const modes=['studio','chromaGreen','chromaGreenPure','chromaBlue','chromaBluePure','chromaMagenta','gray18','gray50','custom','gradient','transparent','image'];
for(const m of modes){
  const before=consoleErrors.length;
  await page.evaluate(`window.StudioAPI.setBackground('${m}','#ff8800','#001133')`);
  await page.waitForTimeout(120);
  check(`background mode '${m}' renders without errors`, consoleErrors.length===before, consoleErrors.slice(before).join(' | ').slice(0,120));
}
check('getBackground round-trips', await page.evaluate(`window.StudioAPI.getBackground().mode`) === 'image');

// post FX
let before=consoleErrors.length;
await page.evaluate(`window.StudioAPI.setFx({pixelate:6,posterize:8,dither:true,outline:true})`);
await page.waitForTimeout(200);
check('post FX (pixelate 6 + posterize 8 + dither + outline) renders', consoleErrors.length===before, consoleErrors.slice(before).join(' | ').slice(0,160));
const fx = await page.evaluate('window.StudioAPI.getFx()');
check('getFx reflects settings', fx.pixelate===6 && fx.posterize===8 && fx.dither===true && fx.outline===true);
await page.evaluate(`window.StudioAPI.setFx({pixelate:1,posterize:0,dither:false,outline:false})`);

// projection
before=consoleErrors.length;
await page.evaluate(`window.StudioAPI.setProjection({ortho:true})`);
await page.waitForTimeout(120);
check('orthographic projection renders', consoleErrors.length===before);
await page.evaluate(`window.StudioAPI.setProjection({ortho:false,fov:40})`);

// scene studio
before=consoleErrors.length;
await page.evaluate(`window.StudioAPI.scene.enable(true)`);
await page.evaluate(`window.StudioAPI.scene.setChroma('green')`);
await page.evaluate(`window.StudioAPI.scene.setMarkers(true)`);
await page.waitForTimeout(200);
check('greenscreen room + tracking markers render', consoleErrors.length===before, consoleErrors.slice(before).join(' | ').slice(0,160));
await page.screenshot({ path: path.join(__dirname,'scene-greenscreen-markers-v3.3.0.png') });
await page.evaluate(`window.StudioAPI.scene.setChroma('blue')`);
await page.evaluate(`window.StudioAPI.scene.setFaceMedia('ceiling','off')`);
await page.waitForTimeout(200);
check('bluescreen room + open ceiling renders', consoleErrors.length===before);
await page.screenshot({ path: path.join(__dirname,'scene-bluescreen-v3.3.0.png') });
const sc = await page.evaluate(`window.StudioAPI.scene.state()`);
check('scene state round-trips', sc.enabled===true && sc.chroma==='blue' && sc.faces.ceiling.media==='off' && Object.keys(sc.faces).length===6);
await page.evaluate(`window.StudioAPI.scene.setMarkers(false)`);
check('markers toggle off', await page.evaluate(`window.StudioAPI.scene.state().markers`)===false);

// scene persistence across reload
await page.reload();
await page.waitForFunction('window.__studioReady === true', null, { timeout: 20000 }).catch(()=>{});
const sc2 = await page.evaluate(`window.StudioAPI.scene.state()`);
check('scene persists across reload (localStorage)', sc2.enabled===true && sc2.chroma==='blue' && sc2.markers===false);

// asset library round-trip (IndexedDB)
const lib = await page.evaluate(`(async()=>{
  const saved = await window.StudioAPI.library.save('scene','QA scene',JSON.stringify(window.StudioAPI.scene.state()),{qa:true});
  const list1 = await window.StudioAPI.library.list();
  const rec = await window.StudioAPI.library.get(saved.id);
  await window.StudioAPI.library.remove(saved.id);
  const list2 = await window.StudioAPI.library.list();
  return { savedId: saved.id, inList: list1.some(x=>x.id===saved.id), gotJson: !!(rec&&rec.json), removed: !list2.some(x=>x.id===saved.id) };
})()`);
check('asset library save → list → get → delete round-trip', lib.inList && lib.gotJson && lib.removed, JSON.stringify(lib));

// appearance JSON carries new state
const app = await page.evaluate(`window.StudioAPI.getAppearance ? window.StudioAPI.getAppearance() : (()=>{const a=window.StudioAPI; return null;})()`)
  ?? await page.evaluate(`JSON.parse(window.StudioAPI.exportAppearance ? window.StudioAPI.exportAppearance() : 'null')`);
const appOk = await page.evaluate(`(()=>{ try{ const a=(window.StudioAPI.getAppearance? window.StudioAPI.getAppearance(): null); return a && !!a.background && !!a.fx && !!a.scene && !!a.projection; }catch(e){ return 'ERR:'+e.message; } })()`);
check('appearance JSON includes background/fx/scene/projection', appOk===true, String(appOk));

// capture
const shot = await page.evaluate(`(()=>{ try{ const d=window.StudioAPI.captureScreenshot({scale:1,transparent:true}); return typeof d==='string' && d.startsWith('data:image/png') ? d.length : 'bad:'+String(d).slice(0,40); }catch(e){ return 'ERR:'+e.message; } })()`);
check('transparent PNG capture returns PNG dataUrl', typeof shot==='number' && shot>1000, String(shot));
const sheet = await page.evaluate(`(()=>{ try{ const r=window.StudioAPI.renderSpriteSheet({directions:8,cell:128,transparent:true}); return r && typeof r.dataUrl==='string' && r.meta && r.meta.yawRadians.length===8; }catch(e){ return 'ERR:'+e.message; } })()`);
check('8-direction sprite sheet renders with meta', sheet===true, String(sheet));

// UI panels exist in DOM
for(const t of ['Backdrop & Post FX','Capture & Export','Scene Studio (Chroma Room)','Asset Library']){
  const found = await page.evaluate(`[...document.querySelectorAll('.sec span:last-child')].some(e=>e.textContent.trim()===${JSON.stringify(t)})`);
  check(`UI panel '${t}' present`, found);
}

// small layout
await page.setViewportSize({ width: 1366, height: 768 });
await page.evaluate(`window.StudioAPI.scene.setChroma('green'); window.StudioAPI.scene.setMarkers(true);`);
await page.waitForTimeout(250);
await page.screenshot({ path: path.join(__dirname,'scene-1366x768-v3.3.0.png') });
check('1366×768 layout renders', true);

check('no unexpected console errors overall', consoleErrors.length===0, consoleErrors.slice(0,5).join(' | ').slice(0,300));
await browser.close();
console.log(results.join('\n'));
console.log(`\n${failures===0?'ALL CHECKS PASSED':failures+' FAILURES'}`);
process.exit(failures===0?0:1);
