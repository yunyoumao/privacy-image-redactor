import JSZip from 'jszip'
import { renderImageToBlob } from './redaction'
import { safeFileStem } from './imageLoader'
import type { ImageItem } from './types'

export function downloadBlob(blob: Blob, fileName: string) {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(href)
}

export async function createRedactedZip(items: ImageItem[]) {
  const zip = new JSZip()

  for (const item of items) {
    const blob = await renderImageToBlob(item)
    zip.file(`${safeFileStem(item.name)}-redacted.png`, blob)
  }

  return zip.generateAsync({ type: 'blob' })
}
