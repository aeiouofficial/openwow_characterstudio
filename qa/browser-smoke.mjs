// Character Studio v1.4 — browser smoke test (wow.export-style layout)
// Usage: node qa/browser-smoke.mjs /path/to/model.glb [/path/to/texture-folder]
// Env: CHROMIUM_PATH (default /usr/local/bin/chromium)
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const modelPath = process.argv[2];
const texFolder = process.argv[3] || null;
if (!modelPath) { console.error('Usage: node qa/browser-smoke.mjs <model.glb> [textureFolder]'); process.exit(2); }
const here = path.dirname(fileURLToPath(import.meta.url));
const appUrl = 'file://' + path.resolve(here, '../demo/character-studio.html');

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/usr/local/bin/chromium', args: ['--disable-gpu', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(appUrl);
await page.locator('#fileModel').setInputFiles(modelPath);
await page.waitForFunction(() => document.getElementById('status').textContent.startsWith('Loaded'), null, { timeout: 60000 });
await page.waitForTimeout(2000);

const out = { ok: false, errors };
out.status = await page.locator('#status').textContent();

// 1. Left panel: customization cyclers render and cycle
out.cyclers = await page.locator('#leftBody .wrow').count();
const faceRow = () => page.locator('#leftBody .wrow').filter({ hasText: 'Face' }).first();
const faceBefore = await faceRow().locator('.wv').textContent();
await faceRow().locator('.arrow').nth(1).click();
out.faceCycle = { before: faceBefore, after: await faceRow().locator('.wv').textContent() };

// 2. Left panel: geoset tick boxes toggle
out.geosetTicks = await page.locator('#leftBody .geo input[type=checkbox]').count();
const tick = page.locator('#leftBody .geo input').first();
const tb = await tick.isChecked(); await tick.click();
out.tickToggled = (await tick.isChecked()) !== tb;

// 3. Left panel: sculpt slider persists
const slider = page.locator('#leftBody .row input[type=range]').first();
await slider.fill('0.55');
out.sculpt = await page.locator('#leftBody .row .v').first().textContent();

// 4. Right panel: equipper slots
out.slots = await page.locator('.slot .sl').allTextContents();

// 5. Texture folder -> slot assignment (optional arg)
if (texFolder) {
  await page.locator('#folderTex').setInputFiles(texFolder);
  await page.waitForTimeout(1500);
  out.folderInfo = await page.locator('#folderInfo').textContent();
  const slot = page.locator('.slot').first();
  await slot.locator('select').selectOption({ index: 1 });
  await page.waitForTimeout(500);
  out.equippedHint = await page.locator('.slot').first().locator('.hint').allTextContents();
}

// 6. Appearance JSON
await page.locator('#btnRef').click();
const json = JSON.parse(await page.locator('#jsonOut').inputValue());
out.appearanceVersion = json.version;
out.engine = json.engine;
out.equippedTextures = json.equippedTextures;

await page.screenshot({ path: path.resolve(here, 'character-studio-qa.png') });
out.ok = errors.length === 0 && out.cyclers >= 6 && out.geosetTicks > 0 && out.tickToggled && out.slots.length > 0 && json.version === 2;
console.log(JSON.stringify(out, null, 2));
await browser.close();
process.exit(out.ok ? 0 : 1);
