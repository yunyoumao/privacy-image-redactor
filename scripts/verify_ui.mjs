import { mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer-core'

const appUrl = process.env.APP_URL ?? 'http://127.0.0.1:5174/privacy-image-redactor/?demo=samples&redacted=1'
const chromePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'

async function checkViewport(browser, width, height, name) {
  const page = await browser.newPage()
  await page.setViewport({ width, height, deviceScaleFactor: 1 })
  await page.goto(appUrl, { waitUntil: 'networkidle0' })
  await page.screenshot({ path: `verification/${name}.png`, fullPage: false })

  const result = await page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    const queueItems = document.querySelectorAll('.queue-item')
    const root = document.documentElement
    const canvasRect = canvas?.getBoundingClientRect()

    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      queueCount: queueItems.length,
      canvasWidth: canvasRect?.width ?? 0,
      canvasHeight: canvasRect?.height ?? 0,
    }
  })

  await page.close()

  if (result.scrollWidth > result.clientWidth + 1) {
    throw new Error(`${name}: horizontal overflow ${result.scrollWidth} > ${result.clientWidth}`)
  }

  if (result.queueCount < 2) {
    throw new Error(`${name}: sample images were not loaded`)
  }

  if (result.canvasWidth < 200 || result.canvasHeight < 120) {
    throw new Error(`${name}: canvas is too small or not rendered`)
  }
}

await mkdir('verification', { recursive: true })

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox'],
})

try {
  await checkViewport(browser, 1440, 1100, 'desktop')
  await checkViewport(browser, 390, 1000, 'mobile')
  console.log('UI verification passed.')
} finally {
  await browser.close()
}
