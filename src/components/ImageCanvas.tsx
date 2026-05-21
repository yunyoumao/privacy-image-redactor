import { useEffect, useRef, useState } from 'react'
import { clampBox, hitTestBox } from '../lib/boxModel'
import { drawEditorCanvas } from '../lib/redaction'
import type { ImageItem, Point, RedactionBox } from '../lib/types'

interface ImageCanvasProps {
  item: ImageItem
  selectedBoxId: string | null
  toolMode: 'select' | 'box'
  onAddBox: (rect: { x: number; y: number; width: number; height: number }) => void
  onSelectBox: (id: string | null) => void
  onUpdateBoxes: (boxes: RedactionBox[]) => void
  onNormalizeRect: (start: Point, end: Point) => { x: number; y: number; width: number; height: number }
}

type DragState =
  | { type: 'draw'; start: Point; current: Point }
  | { type: 'move'; boxId: string; start: Point; original: RedactionBox }
  | { type: 'resize'; boxId: string; start: Point; original: RedactionBox }
  | null

function toImagePoint(canvas: HTMLCanvasElement, clientX: number, clientY: number): Point {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  }
}

export function ImageCanvas({
  item,
  selectedBoxId,
  toolMode,
  onAddBox,
  onSelectBox,
  onUpdateBoxes,
  onNormalizeRect,
}: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drag, setDrag] = useState<DragState>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    drawEditorCanvas(canvas, item.image, item.boxes, selectedBoxId)

    if (drag?.type === 'draw') {
      const context = canvas.getContext('2d')
      if (!context) {
        return
      }
      const rect = onNormalizeRect(drag.start, drag.current)
      context.save()
      context.strokeStyle = '#f97316'
      context.lineWidth = Math.max(2, item.width / 480)
      context.setLineDash([10, 8])
      context.strokeRect(rect.x, rect.y, rect.width, rect.height)
      context.restore()
    }
  }, [drag, item, onNormalizeRect, selectedBoxId])

  return (
    <div className="canvas-frame">
      <canvas
        ref={canvasRef}
        aria-label={`Redaction editor for ${item.name}`}
        onPointerDown={(event) => {
          const canvas = canvasRef.current
          if (!canvas) {
            return
          }
          const point = toImagePoint(canvas, event.clientX, event.clientY)
          canvas.setPointerCapture(event.pointerId)

          if (toolMode === 'box') {
            setDrag({ type: 'draw', start: point, current: point })
            onSelectBox(null)
            return
          }

          const handleSize = Math.max(12, item.width * 0.018)
          const hit = hitTestBox(item.boxes, point, handleSize)
          if (!hit) {
            onSelectBox(null)
            return
          }

          const original = item.boxes.find((box) => box.id === hit.id)
          if (!original) {
            return
          }

          onSelectBox(hit.id)
          setDrag({ type: hit.mode, boxId: hit.id, start: point, original })
        }}
        onPointerMove={(event) => {
          const canvas = canvasRef.current
          if (!canvas || !drag) {
            return
          }
          const point = toImagePoint(canvas, event.clientX, event.clientY)

          if (drag.type === 'draw') {
            setDrag({ ...drag, current: point })
            return
          }

          const dx = point.x - drag.start.x
          const dy = point.y - drag.start.y
          const updated = item.boxes.map((box) => {
            if (box.id !== drag.boxId) {
              return box
            }

            if (drag.type === 'move') {
              return clampBox({ ...box, x: drag.original.x + dx, y: drag.original.y + dy }, item.width, item.height)
            }

            return clampBox({
              ...box,
              width: Math.max(8, drag.original.width + dx),
              height: Math.max(8, drag.original.height + dy),
            }, item.width, item.height)
          })
          onUpdateBoxes(updated)
        }}
        onPointerUp={(event) => {
          const canvas = canvasRef.current
          if (!canvas || !drag) {
            return
          }
          canvas.releasePointerCapture(event.pointerId)

          if (drag.type === 'draw') {
            const rect = onNormalizeRect(drag.start, drag.current)
            if (rect.width >= 12 && rect.height >= 12) {
              onAddBox(rect)
            }
          }
          setDrag(null)
        }}
        onPointerCancel={() => setDrag(null)}
      />
      <div className="canvas-caption">
        <strong>{item.name}</strong>
        <span>{item.width} x {item.height}px · {item.boxes.length} redaction box{item.boxes.length === 1 ? '' : 'es'}</span>
      </div>
    </div>
  )
}
