import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../demo/character-studio.html',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const build=JSON.parse(fs.readFileSync(new URL('../BUILD_INFO.json',import.meta.url),'utf8'));

assert.equal(pkg.version,'4.2.0');
assert.equal(build.version,'4.2.0');
const required=[
  'Machinima Studio Elite','CS_V41_VERSION','character-studio_v4.2.0',
  'cs-pro-shell','cs-pro-timeline','cs-pro-track-row','cs-pro-clip','cs-pro-key',
  'CS_V4_TRACK_TYPES','Reference Video','Dialogue / Voice','Sound FX',
  'function csV4SplitClip','function csV4SnapTime','function csV4RippleDeleteSelection',
  'function csV4ParseTimecode','id="csProMarkIn"','function csV4AddCameraKey',
  'function csV4ToggleVoiceRecord','navigator.mediaDevices?.getUserMedia',
  'CS_V41_BUNDLE_FORMAT','character-studio/machinima-bundle','function csV41DownloadBundle',
  'function csV41InsertAsset','application/x-character-studio-asset',"mode:'slip'",
  'createStereoPanner','v41FitTimeline','v41Follow','v41MarkerColor',
  'v41RenderResolution','v41RenderBitrate','v41CancelRender','data-v41-cam-pos',
  'panX','panZ','sourceId:typeof skySrc.sourceId','.json,.zip,application/json,application/zip',
  'exportPortable:csV41DownloadBundle','fitTimeline:csV41FitTimeline','renderWebM:(options)',
  'id="btnSaveCharacterLibrary"','async function csSaveCurrentCharacterAsset','async function csLoadCharacterLibraryRecord',
  "libSave('character'",'studio/character_state.json',"type==='character'",
  'Character Studio visual-system unification','header .character-save-btn.ready','--pro-accent:#5b96e6',
  "csCanApply=function(type){return ['character'",'saveCharacter:csSaveCurrentCharacterAsset','openCharacter:csLoadCharacterLibraryRecord',
  "['character','appearance','scene'",'aria-keyshortcuts="Control+Alt+S"','function csStorageGet','function csStorageSet'
];
for(const token of required) assert.ok(html.includes(token),`Missing v4.1.1 surface: ${token}`);
assert.match(html,/window\.StudioAPI/);
assert.doesNotMatch(html,/engine:'character-studio_v3\.4\.0'/);
assert.doesNotMatch(html,/window\.StudioAPI\.version='4\.0\.0'/);
console.log(JSON.stringify({ok:true,compatibility:'v4.1.1 surfaces',version:pkg.version,checks:required.length},null,2));
