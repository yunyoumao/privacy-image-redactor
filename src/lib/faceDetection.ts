import { insetBox } from './boxModel'
import type { FaceDetectionResult, RedactionBox } from './types'

type NativeFaceDetector = new (options?: {
  fastMode?: boolean
  maxDetectedFaces?: number
}) => {
  detect: (source: HTMLImageElement) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>
}

declare global {
  interface Window {
    FaceDetector?: NativeFaceDetector
  }
}

export function isFaceDetectorSupported() {
  return typeof window !== 'undefined' && typeof window.FaceDetector === 'function'
}

export async function detectFaces(image: HTMLImageElement): Promise<FaceDetectionResult> {
  if (!isFaceDetectorSupported() || !window.FaceDetector) {
    return {
      supported: false,
      boxes: [],
      message: 'Automatic face detection is unavailable in this browser. Manual redaction still works.',
    }
  }

  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 24 })
    const faces = await detector.detect(image)
    const boxes = faces.map((face) => {
      const box: RedactionBox = {
        id: 'detected-face',
        x: face.boundingBox.x,
        y: face.boundingBox.y,
        width: face.boundingBox.width,
        height: face.boundingBox.height,
        mode: 'blur',
        blur: 18,
        pixelSize: 14,
        color: '#111827',
      }
      return insetBox(box, 0.14)
    })

    return {
      supported: true,
      boxes,
      message: boxes.length > 0
        ? `Detected ${boxes.length} face region${boxes.length === 1 ? '' : 's'}. Review every box before export.`
        : 'No faces were detected. Add manual boxes for private regions.',
    }
  } catch {
    return {
      supported: false,
      boxes: [],
      message: 'Face detection failed in this browser. Manual redaction still works.',
    }
  }
}
