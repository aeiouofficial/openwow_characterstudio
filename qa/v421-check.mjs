import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../demo/character-studio.html',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const build=JSON.parse(fs.readFileSync(new URL('../BUILD_INFO.json',import.meta.url),'utf8'));
const readme=fs.readFileSync(new URL('../README.md',import.meta.url),'utf8');
const api=fs.readFileSync(new URL('../docs/API.md',import.meta.url),'utf8');
const assets=fs.readFileSync(new URL('../docs/ASSET_LIBRARY.md',import.meta.url),'utf8');

assert.equal(pkg.version,'4.2.1');
assert.equal(build.version,'4.2.1');
assert.equal(build.baseVersion,'4.2.0');
const required=[
  'autoAlphaMattes:true','function analyzeBitmapAlpha','blackMatteCandidate','whiteMatteCandidate',
  'function resolveMaterialAlphaState','function exportMaterialAlphaSettings','function restoreMaterialAlphaSettings',
  'Alpha Mattes & Transparency','id="amGlobal"','Auto (recommended)','Use texture alpha',
  'Black matte → transparent','White matte → transparent','Force opaque','Additive glow',
  'uAlphaMatteMode','uMatteThreshold','uMatteSoftness','gl.enable(gl.BLEND)','gl.depthMask(false)',
  'alphaMattePolicy','materialAlphaSettings','characterStudioAlphaMatte','alphaReadyRuntime',
  'async function exportGlbBytesAsync','async function csAlphaReadyTextureBytes','_runtime_alpha_ready.glb',
  'runtime/material_alpha.json','models/source/','packVersion:\'1.1.0\'',
  'exportGlbRuntime','setAutoAlphaMattes','getMaterialAlphaSettings','setMaterialAlphaSetting',
  'Automatically use texture alpha and convert detected black/white mattes to transparency',
  'Saved Character packs and runtime GLB exports embed these settings'
];
for(const token of required)assert.ok(html.includes(token),`Missing v4.2.1 alpha surface: ${token}`);
assert.match(html,/window\.StudioAPI\.version=CS_V42_VERSION/);
assert.match(html,/const CS_V42_VERSION='4\.2\.1'/);
assert.match(readme,/Auto-fix alpha mattes is enabled by default/);
assert.match(api,/Alpha matte API \(v4\.2\.1\)/);
assert.match(assets,/Alpha-ready character assets \(v4\.2\.1\)/);
assert.doesNotMatch(html,/outColor=vec4\(base\*light,1\.0\)/);
console.log(JSON.stringify({ok:true,version:pkg.version,checks:required.length+10},null,2));
