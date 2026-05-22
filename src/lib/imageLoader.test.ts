import { describe, expect, it } from 'vitest'
import {
  MAX_IMAGE_DIMENSION,
  MAX_IMAGE_FILE_BYTES,
  MAX_IMAGE_PIXELS,
  safeFileStem,
  validateImageDimensions,
  validateImageFile,
} from './imageLoader'

describe('image loader safety limits', () => {
  it('rejects unsupported file types', () => {
    const file = new File(['<svg></svg>'], 'sample.svg', { type: 'image/svg+xml' })
    expect(() => validateImageFile(file)).toThrow(/not a supported/)
  })

  it('rejects oversized files before decoding', () => {
    const file = new File([new Uint8Array(MAX_IMAGE_FILE_BYTES + 1)], 'huge.png', { type: 'image/png' })
    expect(() => validateImageFile(file)).toThrow(/larger than/)
  })

  it('rejects images with too many pixels', () => {
    expect(() => validateImageDimensions('huge.png', MAX_IMAGE_PIXELS, 2)).toThrow(/too large/)
    expect(() => validateImageDimensions('wide.png', MAX_IMAGE_DIMENSION + 1, 100)).toThrow(/too large/)
  })

  it('normalizes download file names', () => {
    expect(safeFileStem('My Private Screenshot.PNG')).toBe('my-private-screenshot')
  })
})
