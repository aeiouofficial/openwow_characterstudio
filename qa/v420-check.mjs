import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../demo/character-studio.html',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const build=JSON.parse(fs.readFileSync(new URL('../BUILD_INFO.json',import.meta.url),'utf8'));
assert.equal(pkg.version,'4.2.1');assert.equal(build.version,'4.2.1');
const required=[
 'CS_V42_VERSION','character-studio_v4.2.1','Unified Workspace UX & Metal Panel System',
 'cs-ux-commandbar',"['animation','animation','Animate']","['camera','camera','Camera']","['audio','audio','Audio']","['review','review','Review']",
 'function csV42SetLayout','function csV42ApplyShellState','function csV42WireCommandBar','function csV42PanelHeaders',
 'function csV42Accordions','function csV42FilterInspector','function csV42Resizers','cs-ux-resizer',
 'function csV42ShowCommands','cs-ux-command-palette','Ctrl+K','setWorkspace:csV42SetLayout',
 'function csV42AssetsPolish','cs-ux-preview-anim','Preview this animation in the viewport','cs-ux-animation-settings',
 'Main editor dock & section polish','cs-main-panel-head','function csV42EnhanceMainPanel','function csV42FilterMainPanel',
 'cs-main-resizer','window.StudioAPI.panels','main-left-collapsed','main-right-collapsed',
 'cs-main-scope','Find settings','Core','Advanced','cs-main-open',
 'prefers-reduced-motion','aria-expanded','role','separator','aria-orientation',
 'compact overlay correction','cs-ux-dock-scrim','mobile-panel-open',
 'id="btnSaveCharacterLibrary"','async function csSaveCurrentCharacterAsset','CS_V41_BUNDLE_FORMAT',
 'cs-pro-timeline','function csV4SplitClip','function csV41DownloadBundle','renderWebM:(options)'
];
for(const token of required)assert.ok(html.includes(token),`Missing v4.2.0 surface: ${token}`);
assert.doesNotMatch(html,/engine:'character-studio_v4\.1\.1'/);
assert.match(html,/document\.querySelector\('\.ver'\)\.textContent='— made by AEiOU · v4\.2\.1'/);
console.log(JSON.stringify({ok:true,version:pkg.version,checks:required.length},null,2));
