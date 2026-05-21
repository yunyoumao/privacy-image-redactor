import type { Point, RedactionBox, RedactionDefaults } from './types'

export function createBox(rect: {
  x: number
  y: number
  width: number
  height: number
}, defaults: RedactionDefaults): RedactionBox {
  return {
    id: crypto.randomUUID(),
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    mode: defaults.mode,
    blur: defaults.blur,
    pixelSize: defaults.pixelSize,
    color: defaults.color,
  }
}

export function clampBox(box: RedactionBox, imageWidth: number, imageHeight: number): RedactionBox {
  const width = Math.min(Math.max(box.width, 8), imageWidth)
  const height = Math.min(Math.max(box.height, 8), imageHeight)
  const x = Math.min(Math.max(box.x, 0), Math.max(0, imageWidth - width))
  const y = Math.min(Math.max(box.y, 0), Math.max(0, imageHeight - height))
  return { ...box, x, y, width, height }
}

export function normalizeRect(start: Point, end: Point) {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }
}

export function insetBox(box: RedactionBox, ratio: number): RedactionBox {
  const insetX = box.width * ratio
  const insetY = box.height * ratio
  return {
    ...box,
    x: box.x - insetX,
    y: box.y - insetY,
    width: box.width + insetX * 2,
    height: box.height + insetY * 2,
  }
}

export function hitTestBox(boxes: RedactionBox[], point: Point, handleSize: number) {
  for (let index = boxes.length - 1; index >= 0; index -= 1) {
    const box = boxes[index]
    const handleX = box.x + box.width
    const handleY = box.y + box.height
    const onHandle =
      Math.abs(point.x - handleX) <= handleSize &&
      Math.abs(point.y - handleY) <= handleSize

    if (onHandle) {
      return { id: box.id, mode: 'resize' as const }
    }

    const inside =
      point.x >= box.x &&
      point.x <= box.x + box.width &&
      point.y >= box.y &&
      point.y <= box.y + box.height

    if (inside) {
      return { id: box.id, mode: 'move' as const }
    }
  }

  return null
}
