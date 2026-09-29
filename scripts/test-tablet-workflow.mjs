/** Regression checks for the workflow tablet layout. Build Storybook first. */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
const root = path.resolve('apps/storybook/storybook-static')
const output = path.resolve('reports/responsive/tablet-after')
await mkdir(output, { recursive: true })
const server = createServer(async (req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://local').pathname)
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end()
  try {
    const data = await readFile(file)
    const mime = {
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.html': 'text/html',
      '.json': 'application/json',
    }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
    res.end(data)
  } catch {
    res.writeHead(404).end()
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const checks = []
try {
  for (const width of [768, 820, 1024, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce',
    })
    await context.route('**/*', (route) =>
      new URL(route.request().url()).origin === base ? route.continue() : route.abort(),
    )
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`${base}/iframe.html?id=recipes-workflows-loan-review-run--run&viewMode=story`)
    await page.getByRole('button', { name: 'Normal', exact: true }).waitFor()
    await page.locator('.react-flow__node').first().waitFor()
    await page.waitForTimeout(500)
    const canvas = await page.locator('.react-flow').boundingBox()
    assert(
      canvas.width >= (width < 1280 ? width - 64 : 500),
      `Canvas too narrow at ${width}: ${canvas.width}`,
    )
    const fullyVisible = async (locator) => {
      await locator.waitFor({ state: 'visible' })
      const r = await locator.boundingBox()
      assert(
        r && r.x >= 0 && r.x + r.width <= width + 1 && r.y >= 0 && r.y + r.height <= 900,
        `Control outside viewport at ${width}`,
      )
    }
    for (const name of ['Normal', 'Compact', 'Run log'])
      await fullyVisible(page.getByRole('button', { name, exact: true }))
    await page.screenshot({ path: path.join(output, `workflow-${width}.png`) })
    if (width < 1280) {
      const outline = page.getByRole('button', { name: 'Show run panel', exact: true })
      await outline.click()
      await page.getByRole('dialog', { name: 'Run outline', exact: true }).waitFor()
      await fullyVisible(page.getByRole('button', { name: 'Close dialog', exact: true }))
      await page.keyboard.press('Escape')
      await page.getByRole('dialog').waitFor({ state: 'hidden' })
      assert(
        await outline.evaluate((el) => el === document.activeElement),
        'Outline focus did not restore',
      )
      const details = page.getByRole('button', { name: 'Show step details', exact: true })
      await details.click()
      const dialog = page.getByRole('dialog', { name: 'Step details', exact: true })
      await dialog.waitFor()
      for (const name of ['Approve', 'Request changes', 'Decline'])
        await fullyVisible(dialog.getByRole('button', { name, exact: true }))
      await page.screenshot({ path: path.join(output, `workflow-details-${width}.png`) })
      await page.keyboard.press('Escape')
      await dialog.waitFor({ state: 'hidden' })
      assert(
        await details.evaluate((el) => el === document.activeElement),
        'Details focus did not restore',
      )
      await page.getByRole('button', { name: 'Compact', exact: true }).click()
      assert.equal(
        await page
          .getByRole('button', { name: 'Compact', exact: true })
          .getAttribute('aria-pressed'),
        'true',
      )
    }
    assert.deepEqual(errors, [])
    checks.push({ width, canvasWidth: Math.round(canvas.width), passed: true })
    await context.close()
  }
  await writeFile(path.join(output, 'workflow-checks.json'), JSON.stringify(checks, null, 2))
  console.log(checks)
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}
