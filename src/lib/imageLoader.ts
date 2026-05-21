import type { ImageItem } from './types'

export function loadImageFile(file: File): Promise<ImageItem> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
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
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))
  return Promise.all(imageFiles.map((file) => loadImageFile(file)))
}

export function safeFileStem(name: string) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'redacted-image'
}
