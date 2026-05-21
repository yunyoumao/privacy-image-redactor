import { describe, expect, it, vi } from 'vitest'
import { clampBox, createBox, hitTestBox, normalizeRect } from './boxModel'

vi.stubGlobal('crypto', { randomUUID: () => 'box-1' })

describe('box model', () => {
  it('creates redaction boxes with defaults', () => {
    const box = createBox(
      { x: 10, y: 20, width: 120, height: 80 },
      { mode: 'pixelate', blur: 18, pixelSize: 16, color: '#111827' },
    )

    expect(box).toMatchObject({
      id: 'box-1',
      mode: 'pixelate',
      blur: 18,
      pixelSize: 16,
      color: '#111827',
    })
  })

  it('keeps boxes inside image bounds', () => {
    const box = clampBox(
      {
        id: 'box',
        x: -20,
        y: 90,
        width: 140,
        height: 40,
        mode: 'blur',
        blur: 16,
        pixelSize: 12,
        color: '#111827',
      },
      100,
      100,
    )

    expect(box.x).toBe(0)
    expect(box.y).toBe(60)
    expect(box.width).toBe(100)
    expect(box.height).toBe(40)
  })

  it('normalizes drag rectangles', () => {
    expect(normalizeRect({ x: 80, y: 40 }, { x: 10, y: 90 })).toEqual({
      x: 10,
      y: 40,
      width: 70,
      height: 50,
    })
  })

  it('hits resize handles before move regions', () => {
    const hit = hitTestBox(
      [
        {
          id: 'box',
          x: 10,
          y: 20,
          width: 120,
          height: 80,
          mode: 'blur',
          blur: 16,
          pixelSize: 12,
          color: '#111827',
        },
      ],
      { x: 130, y: 100 },
      12,
    )

    expect(hit).toEqual({ id: 'box', mode: 'resize' })
  })
})
