import {
  FaceDetector as MediaPipeFaceDetector,
  FilesetResolver,
  type Detection,
} from '@mediapipe/tasks-vision'
import { insetBox } from './boxModel'
import type { FaceDetectionResult, RedactionBox } from './types'

const MEDIAPIPE_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm'
const MEDIAPIPE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite'

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

let mediaPipeDetectorPromise: Promise<MediaPipeFaceDetector> | null = null

export function isFaceDetectorSupported() {
  return typeof window !== 'undefined' && typeof window.FaceDetector === 'function'
}

function toExpandedBox(rect: {
  x: number
  y: number
  width: number
  height: number
}): Pick<RedactionBox, 'x' | 'y' | 'width' | 'height'> {
  const box: RedactionBox = {
    id: 'detected-face',
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    mode: 'blur',
    blur: 18,
    pixelSize: 14,
    color: '#111827',
  }
  return insetBox(box, 0.18)
}

function nativeBox(face: { boundingBox: DOMRectReadOnly }) {
  return toExpandedBox({
    x: face.boundingBox.x,
    y: face.boundingBox.y,
    width: face.boundingBox.width,
    height: face.boundingBox.height,
  })
}

function mediaPipeBox(detection: Detection) {
  const box = detection.boundingBox
  if (!box) {
    return null
  }
  return toExpandedBox({
    x: box.originX,
    y: box.originY,
    width: box.width,
    height: box.height,
  })
}

async function getMediaPipeDetector() {
  mediaPipeDetectorPromise ??= FilesetResolver
    .forVisionTasks(MEDIAPIPE_WASM_URL)
    .then((vision) => MediaPipeFaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MEDIAPIPE_MODEL_URL,
        delegate: 'CPU',
      },
      runningMode: 'IMAGE',
      minDetectionConfidence: 0.35,
      minSuppressionThreshold: 0.3,
    }))

  return mediaPipeDetectorPromise
}

async function detectWithNativeFaceDetector(image: HTMLImageElement) {
  if (!isFaceDetectorSupported() || !window.FaceDetector) {
    return []
  }

  try {
    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 24 })
    const faces = await detector.detect(image)
    return faces.map(nativeBox)
  } catch {
    return []
  }
}

async function detectWithMediaPipe(image: HTMLImageElement) {
  const detector = await getMediaPipeDetector()
  const result = detector.detect(image)
  return result.detections
    .map(mediaPipeBox)
    .filter((box): box is Pick<RedactionBox, 'x' | 'y' | 'width' | 'height'> => box !== null)
}

export async function detectFaces(image: HTMLImageElement): Promise<FaceDetectionResult> {
  const nativeBoxes = await detectWithNativeFaceDetector(image)

  if (nativeBoxes.length > 0) {
    return {
      supported: true,
      boxes: nativeBoxes,
      message: `Detected ${nativeBoxes.length} face region${nativeBoxes.length === 1 ? '' : 's'} with the browser detector. Review every box before export.`,
    }
  }

  try {
    const mediaPipeBoxes = await detectWithMediaPipe(image)

    return {
      supported: true,
      boxes: mediaPipeBoxes,
      message: mediaPipeBoxes.length > 0
        ? `Detected ${mediaPipeBoxes.length} face region${mediaPipeBoxes.length === 1 ? '' : 's'} with the MediaPipe fallback. Review every box before export.`
        : 'No faces were detected. ID cards and screenshots can be missed; draw manual boxes over any private regions before export.',
    }
  } catch {
    return {
      supported: false,
      boxes: [],
      message: 'Automatic face detection failed. Draw manual boxes over faces and private regions before export.',
    }
  }
}
