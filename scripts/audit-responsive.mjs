/** Build Storybook first. Run: npm run audit:responsive
 * Optional: STORYBOOK_URL=http://localhost:6006 AUDIT_WIDTHS=768,820,1024,1440
 * This is a geometry audit, not proof of accessibility or functional correctness.
 */
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const output = path.resolve(process.env.AUDIT_OUTPUT || 'reports/responsive')
const widths = (process.env.AUDIT_WIDTHS || '320,360,390,768,820,1024,1440').split(',').map(Number)
const root = path.resolve('apps/storybook/storybook-static')
let server
let base = process.env.STORYBOOK_URL
if (!base) {
  const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
  }
  server = createServer(async (req, res) => {
    const file = path.resolve(
      root,
      '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname),
    )
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403).end()
      return
    }
    try {
      const data = await readFile(file)
      res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
      res.end(data)
    } catch {
      res.writeHead(404).end()
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
}
await mkdir(path.join(output, 'screenshots'), { recursive: true })
const index = await (await fetch(`${base}/index.json`)).json()
const excluded = Object.values(index.entries).filter(
  (s) => s.type === 'story' && /\/((Alert)|(Card))$/.test(s.title),
)
const stories = Object.values(index.entries).filter(
  (s) =>
    s.type === 'story' &&
    !excluded.includes(s) &&
    (!process.env.AUDIT_MATCH || s.id.includes(process.env.AUDIT_MATCH)),
)
const browser = await chromium.launch({ headless: true })
const results = []
let cursor = 0
async function worker() {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 900 },
    reducedMotion: 'reduce',
  })
  // Do not send story content to external origins; external fonts/images may be unavailable.
  await context.route('**/*', (route) =>
    new URL(route.request().url()).origin === new URL(base).origin
      ? route.continue()
      : route.abort(),
  )
  const page = await context.newPage()
  let errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  while (cursor < stories.length) {
    const story = stories[cursor++]
    errors = []
    try {
      await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`, {
        waitUntil: 'load',
        timeout: 20000,
      })
      await page.waitForFunction(
        () =>
          document.querySelector('#storybook-root')?.children.length ||
          document.body.classList.contains('sb-show-errordisplay'),
        null,
        { timeout: 10000 },
      )
      await page.waitForTimeout(250)
      for (const width of widths.filter(
        (width) => width >= 768 || story.title.startsWith('Recipes/Chat/'),
      )) {
        await page.setViewportSize({ width, height: 900 })
        await page.waitForTimeout(120)
        const metrics = await page.evaluate(() => {
          const view = document.documentElement.clientWidth
          const visible = (el) => {
            const r = el.getBoundingClientRect(),
              s = getComputedStyle(el)
            return (
              r.width > 2 &&
              r.height > 2 &&
              s.display !== 'none' &&
              s.visibility !== 'hidden' &&
              s.opacity !== '0' &&
              !el.closest('[aria-hidden="true"],.sr-only,[hidden]')
            )
          }
          const describe = (el) => ({
            tag: el.tagName.toLowerCase(),
            text: (el.getAttribute('aria-label') || el.textContent || '')
              .trim()
              .replace(/\s+/g, ' ')
              .slice(0, 100),
            class: String(el.className).slice(0, 180),
          })
          const overflow = [],
            clippedControls = [],
            scrolling = [],
            truncated = []
          for (const el of document.querySelectorAll(
            '#storybook-root *, [data-chat-overlay-layer] *',
          )) {
            if (!visible(el)) continue
            const r = el.getBoundingClientRect(),
              style = getComputedStyle(el)
            let scrollParent = null,
              clipParent = null
            for (
              let parent = el.parentElement;
              parent && parent !== document.body;
              parent = parent.parentElement
            ) {
              const s = getComputedStyle(parent),
                p = parent.getBoundingClientRect()
              if (
                ['auto', 'scroll'].includes(s.overflowX) &&
                parent.scrollWidth > parent.clientWidth + 2
              )
                scrollParent ??= parent
              if (
                ['hidden', 'clip'].includes(s.overflowX) &&
                (r.left < p.left - 2 || r.right > p.right + 2)
              )
                clipParent ??= parent
            }
            if ((r.right > view + 2 || r.left < -2) && !scrollParent && !clipParent)
              overflow.push({
                ...describe(el),
                left: Math.round(r.left),
                right: Math.round(r.right),
                excess: Math.round(Math.max(r.right - view, -r.left)),
              })
            if (
              el.matches('button,input,select,textarea,[role="button"],a[href]') &&
              clipParent &&
              !scrollParent
            )
              clippedControls.push({ ...describe(el), parent: describe(clipParent) })
            if (['auto', 'scroll'].includes(style.overflowX) && el.scrollWidth > el.clientWidth + 2)
              scrolling.push(describe(el))
            if (style.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 2)
              truncated.push(describe(el))
          }
          return {
            documentOverflow: Math.max(0, document.documentElement.scrollWidth - view),
            overflow: overflow.sort((a, b) => b.excess - a.excess).slice(0, 12),
            clippedControls: clippedControls.slice(0, 12),
            scrolling: scrolling.slice(0, 8),
            truncated: truncated.slice(0, 8),
            error:
              document.querySelector('.sb-errordisplay') &&
              visible(document.querySelector('.sb-errordisplay'))
                ? document.querySelector('.sb-errordisplay').textContent.trim().slice(0, 500)
                : null,
          }
        })
        let screenshot = null
        if (
          process.env.AUDIT_CAPTURE === '1' ||
          metrics.documentOverflow > 2 ||
          metrics.overflow.length ||
          metrics.clippedControls.length ||
          metrics.error
        ) {
          screenshot = `screenshots/${story.id}-${width}.png`
          await page.screenshot({ path: path.join(output, screenshot), fullPage: false })
        }
        results.push({
          id: story.id,
          title: story.title,
          name: story.name,
          width,
          ...metrics,
          errors: [...errors],
          screenshot,
        })
      }
    } catch (error) {
      results.push({
        id: story.id,
        title: story.title,
        name: story.name,
        error: error.message,
        errors: [...errors],
      })
    }
    if (cursor % 20 === 0) console.log(`Audited ${cursor}/${stories.length} stories`)
  }
  await context.close()
}
try {
  await Promise.all(Array.from({ length: 4 }, worker))
} finally {
  await browser.close()
  if (server) await new Promise((resolve) => server.close(resolve))
}
results.sort((a, b) => a.id.localeCompare(b.id) || (a.width || 0) - (b.width || 0))
const candidates = results.filter(
  (r) =>
    r.width < 1440 && (r.documentOverflow > 2 || r.overflow?.length || r.clippedControls?.length),
)
const report = {
  generated: new Date().toISOString(),
  widths,
  storyCount: stories.length,
  componentCount: new Set(stories.map((s) => s.title)).size,
  excluded: excluded.map((s) => s.id),
  results,
}
await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2))
const escape = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
await writeFile(
  path.join(output, 'gallery.html'),
  `<!doctype html><html><head><meta charset="utf-8"><title>Tablet and chat responsive audit</title><style>body{font:14px system-ui;margin:24px;background:#f5f6f8;color:#182030}article{display:inline-block;vertical-align:top;width:340px;margin:12px;padding:16px;background:white;border:1px solid #ccd2dd}img{width:320px;max-width:100%}code{word-break:break-all}</style></head><body><h1>Tablet and chat responsive audit candidates</h1><p>${stories.length} stories; ${new Set(stories.map((s) => s.title)).size} groups. Alert and Card excluded. Non-chat: tablet ≥768px. Chat: phone + tablet. Geometry flags require review; external assets blocked.</p>${results
    .filter((r) => r.screenshot)
    .map(
      (r) =>
        `<article><h2>${escape(r.title)}</h2><p>${escape(r.name)} · ${r.width}px · document overflow ${r.documentOverflow}px</p><img src="${r.screenshot}"><p>${escape(r.overflow?.[0]?.text)}</p><code>${escape(r.id)}</code></article>`,
    )
    .join('')}</body></html>`,
)
console.log(
  JSON.stringify({
    stories: stories.length,
    components: report.componentCount,
    cases: results.length,
    flaggedCases: candidates.length,
    renderErrors: results.filter((r) => r.error || r.errors.length).length,
    output,
  }),
)
if (
  process.env.AUDIT_FAIL === '1' &&
  (candidates.length || results.some((r) => r.error || r.errors.length))
)
  process.exitCode = 1
