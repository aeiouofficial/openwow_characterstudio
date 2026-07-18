#!/usr/bin/env node
// CHARACTER STUDIO - made by AEiOU — headless runner for agents/CI
// Usage: node qa/headless-runner.mjs <model.glb|pack.zip> [--appearance=file.json] [--viewmode=tex|matid|groups] [--out=shot.png] [--json=report.json]
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const args = process.argv.slice(2)
const input = args.find(a => !a.startsWith('--'))
if (!input) { console.error('Usage: node qa/headless-runner.mjs <model.glb|pack.zip> [--appearance=f.json] [--viewmode=m] [--out=shot.png] [--json=report.json]'); process.exit(2) }
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.split('=').slice(1).join('=') : null }
const outPng = opt('out'), outJson = opt('json'), viewmode = opt('viewmode'), appearanceFile = opt('appearance')

const here = path.dirname(fileURLToPath(import.meta.url))
const appUrl = 'file://' + path.resolve(here, '../demo/character-studio.html') + '?headless=1'

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/local/bin/chromium', args: ['--no-sandbox', '--use-gl=swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } })
const errors = []
page.on('pageerror', e => errors.push('pageerror: ' + e.message))
await page.goto(appUrl)
await page.waitForFunction(() => window.__studioReady === true, null, { timeout: 30000 })

await page.setInputFiles('#fileModel', path.resolve(input))
await page.waitForFunction(() => /Loaded|Pack \u201c/.test(window.StudioAPI.getStatus()), null, { timeout: 180000 })

if (appearanceFile) {
  const app = fs.readFileSync(appearanceFile, 'utf8')
  await page.evaluate(a => window.StudioAPI.applyAppearance(a), app)
  await page.waitForTimeout(500)
}
if (viewmode) await page.evaluate(m => window.StudioAPI.setViewMode(m), viewmode)
await page.waitForTimeout(1200)

const report = await page.evaluate(() => ({
  brand: window.StudioAPI.brand,
  version: window.StudioAPI.version,
  status: window.StudioAPI.getStatus(),
  geosets: window.StudioAPI.listGeosets().length,
  textures: window.StudioAPI.listTextures().length,
  gearsets: window.StudioAPI.listGearsets(),
  pack: window.StudioAPI.getPack() ? { name: window.StudioAPI.getPack().name, files: window.StudioAPI.getPack().files.length, docs: window.StudioAPI.getPack().docs } : null,
  viewMode: window.StudioAPI.getViewMode(),
}))
report.errors = errors

if (outPng) {
  const dataUrl = await page.evaluate(() => window.StudioAPI.screenshot())
  fs.writeFileSync(outPng, Buffer.from(dataUrl.split(',')[1], 'base64'))
  report.screenshot = outPng
}
if (outJson) fs.writeFileSync(outJson, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
await browser.close()
process.exit(errors.length ? 1 : 0)
