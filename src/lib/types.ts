export type RedactionMode = 'blur' | 'pixelate' | 'solid'

export interface RedactionBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  mode: RedactionMode
  blur: number
  pixelSize: number
  color: string
}

export interface RedactionDefaults {
  mode: RedactionMode
  blur: number
  pixelSize: number
  color: string
}

export interface ImageItem {
  id: string
  name: string
  type: string
  size: number
  url: string
  image: HTMLImageElement
  width: number
  height: number
  boxes: RedactionBox[]
}

export interface Point {
  x: number
  y: number
}

export interface FaceDetectionResult {
  supported: boolean
  boxes: Array<Pick<RedactionBox, 'x' | 'y' | 'width' | 'height'>>
  message: string
}
