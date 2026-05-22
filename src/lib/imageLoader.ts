import type { ImageItem } from './types'

const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
export const MAX_IMAGE_FILE_BYTES = 25 * 1024 * 1024
export const MAX_IMAGE_PIXELS = 32_000_000
export const MAX_IMAGE_DIMENSION = 10_000

function formatLimit(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} MB`
}

export function validateImageFile(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error(`${file.name} is not a supported PNG, JPEG, or WebP image.`)
  }
  if (file.size > MAX_IMAGE_FILE_BYTES) {
    throw new Error(`${file.name} is larger than ${formatLimit(MAX_IMAGE_FILE_BYTES)}.`)
  }
}

export function validateImageDimensions(fileName: string, width: number, height: number) {
  const pixels = width * height
  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION || pixels > MAX_IMAGE_PIXELS) {
    throw new Error(`${fileName} is too large to edit safely in the browser (${width} x ${height} px).`)
  }
}

export function loadImageFile(file: File): Promise<ImageItem> {
  validateImageFile(file)
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      try {
        validateImageDimensions(file.name, image.naturalWidth, image.naturalHeight)
      } catch (error) {
        URL.revokeObjectURL(url)
        reject(error)
        return
      }
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || 'image/png',
        size: file.size,
        url,
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        boxes: [],
      })
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not load ${file.name}.`))
    }

    image.src = url
  })
}

export async function loadImageFiles(files: File[]) {
  const imageFiles = files.filter((file) => SUPPORTED_IMAGE_TYPES.has(file.type))
  return Promise.all(imageFiles.map((file) => loadImageFile(file)))
}

export function safeFileStem(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'redacted-image'
}
