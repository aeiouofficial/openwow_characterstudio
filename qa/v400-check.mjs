import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../demo/character-studio.html',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

assert.equal(pkg.version,'4.1.0');
const required=[
  'Machinima Studio','cs-pro-shell','cs-pro-timeline','cs-pro-track-row','cs-pro-clip','cs-pro-key',
  'CS_V4_TRACK_TYPES','Reference Video','Dialogue / Voice','Sound FX','function csV4SplitClip',
  'function csV4SnapTime','function csV4RippleDeleteSelection','function csV4ParseTimecode','id="csProMarkIn"','function csV4AddCameraKey','function csV4ToggleVoiceRecord',
  'function csV4StartExport','captureStream','MediaRecorder','machinima:{getProject',
  "type==='machinima'","type==='audio'","type==='video'",'cs_machinima_project_v1',
  '@media(max-width:1080px)','@media(max-width:780px)'
];
for(const token of required) assert.ok(html.includes(token),`Missing retained v4.0 surface: ${token}`);
assert.match(html,/character-studio_v4\.1\.0/);
assert.match(html,/window\.StudioAPI/);
assert.doesNotMatch(html,/engine:'character-studio_v3\.4\.0'/);
console.log(JSON.stringify({ok:true,version:pkg.version,checks:required.length},null,2));
