import type { ImageItem, RedactionBox } from './types'

function drawPixelated(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  box: RedactionBox,
) {
  const blockSize = Math.max(4, Math.round(box.pixelSize))
  const width = Math.max(1, Math.round(box.width / blockSize))
  const height = Math.max(1, Math.round(box.height / blockSize))
  const scratch = document.createElement('canvas')
  scratch.width = width
  scratch.height = height
  const scratchContext = scratch.getContext('2d')

  if (!scratchContext) {
    return
  }

  scratchContext.imageSmoothingEnabled = false
  scratchContext.drawImage(image, box.x, box.y, box.width, box.height, 0, 0, width, height)

  context.save()
  context.imageSmoothingEnabled = false
  context.drawImage(scratch, 0, 0, width, height, box.x, box.y, box.width, box.height)
  context.restore()
}

function drawBlurred(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  box: RedactionBox,
) {
  context.save()
  context.beginPath()
  context.rect(box.x, box.y, box.width, box.height)
  context.clip()
  context.filter = `blur(${Math.max(2, box.blur)}px)`
  context.drawImage(image, box.x, box.y, box.width, box.height, box.x, box.y, box.width, box.height)
  context.restore()
}

export function drawRedactedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  boxes: RedactionBox[],
) {
  context.clearRect(0, 0, image.naturalWidth, image.naturalHeight)
  context.filter = 'none'
  context.imageSmoothingEnabled = true
  context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight)

  boxes.forEach((box) => {
    if (box.mode === 'solid') {
      context.save()
      context.fillStyle = box.color
      context.fillRect(box.x, box.y, box.width, box.height)
      context.restore()
      return
    }

    if (box.mode === 'pixelate') {
      drawPixelated(context, image, box)
      return
    }

    drawBlurred(context, image, box)
  })
}

export function drawEditorCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  boxes: RedactionBox[],
  selectedBoxId: string | null,
) {
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d')

  if (!context) {
    return
  }

  drawRedactedImage(context, image, boxes)

  boxes.forEach((box) => {
    const selected = box.id === selectedBoxId
    context.save()
    context.strokeStyle = selected ? '#f97316' : '#0f766e'
    context.lineWidth = Math.max(2, image.naturalWidth / 480)
    context.setLineDash(selected ? [] : [8, 6])
    context.strokeRect(box.x, box.y, box.width, box.height)

    if (selected) {
      const handle = Math.max(12, image.naturalWidth * 0.016)
      context.fillStyle = '#f97316'
      context.fillRect(box.x + box.width - handle / 2, box.y + box.height - handle / 2, handle, handle)
    }

    context.restore()
  })
}

export function renderImageToBlob(item: ImageItem, type = 'image/png'): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = item.width
  canvas.height = item.height
  const context = canvas.getContext('2d')

  if (!context) {
    return Promise.reject(new Error('Canvas is not available in this browser.'))
  }

  drawRedactedImage(context, item.image, item.boxes)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not export the image.'))
        return
      }
      resolve(blob)
    }, type)
  })
}
