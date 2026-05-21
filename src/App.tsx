import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  Download,
  Eraser,
  EyeOff,
  MousePointer2,
  ScanFace,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Trash2,
  Upload,
} from 'lucide-react'
import './App.css'
import { clampBox, createBox, normalizeRect } from './lib/boxModel'
import { detectFaces, isFaceDetectorSupported } from './lib/faceDetection'
import { createRedactedZip, downloadBlob } from './lib/exportZip'
import { loadImageFiles, safeFileStem } from './lib/imageLoader'
import type { ImageItem, RedactionBox, RedactionDefaults, RedactionMode } from './lib/types'
import { ImageCanvas } from './components/ImageCanvas'
import { renderImageToBlob } from './lib/redaction'

const defaultSettings: RedactionDefaults = {
  mode: 'blur',
  blur: 18,
  pixelSize: 16,
  color: '#111827',
}

function fileSizeLabel(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const itemsRef = useRef<ImageItem[]>([])
  const [items, setItems] = useState<ImageItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [toolMode, setToolMode] = useState<'select' | 'box'>('box')
  const [defaults, setDefaults] = useState<RedactionDefaults>(defaultSettings)
  const [dragActive, setDragActive] = useState(false)
  const [status, setStatus] = useState('Drop images to begin. Everything stays in this browser.')
  const [busy, setBusy] = useState(false)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  const selectedBox = useMemo(
    () => selectedItem?.boxes.find((box) => box.id === selectedBoxId) ?? null,
    [selectedBoxId, selectedItem],
  )

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => () => {
    itemsRef.current.forEach((item) => URL.revokeObjectURL(item.url))
  }, [])

  const mergeItems = useCallback((loadedItems: ImageItem[]) => {
    setItems((current) => [...current, ...loadedItems])
    setSelectedId((current) => current ?? loadedItems[0]?.id ?? null)
    setStatus(`${loadedItems.length} image${loadedItems.length === 1 ? '' : 's'} loaded. Add redaction boxes before export.`)
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      return
    }

    setBusy(true)
    try {
      const loaded = await loadImageFiles(files)
      if (loaded.length === 0) {
        setStatus('No supported image files were found.')
        return
      }
      mergeItems(loaded)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load the selected images.')
    } finally {
      setBusy(false)
    }
  }, [mergeItems])

  const updateSelectedItem = useCallback((updater: (item: ImageItem) => ImageItem) => {
    setItems((current) => current.map((item) => (item.id === selectedId ? updater(item) : item)))
  }, [selectedId])

  const addBox = useCallback((rect: { x: number; y: number; width: number; height: number }) => {
    if (!selectedItem) {
      return
    }

    const box = clampBox(createBox(rect, defaults), selectedItem.width, selectedItem.height)
    updateSelectedItem((item) => ({ ...item, boxes: [...item.boxes, box] }))
    setSelectedBoxId(box.id)
    setStatus('Redaction box added. Review the preview before export.')
  }, [defaults, selectedItem, updateSelectedItem])

  const updateBox = useCallback((boxId: string, updater: (box: RedactionBox) => RedactionBox) => {
    updateSelectedItem((item) => ({
      ...item,
      boxes: item.boxes.map((box) => (
        box.id === boxId ? clampBox(updater(box), item.width, item.height) : box
      )),
    }))
  }, [updateSelectedItem])

  const updateBoxes = useCallback((boxes: RedactionBox[]) => {
    updateSelectedItem((item) => ({ ...item, boxes }))
  }, [updateSelectedItem])

  const removeSelectedBox = () => {
    if (!selectedBoxId) {
      return
    }
    updateSelectedItem((item) => ({ ...item, boxes: item.boxes.filter((box) => box.id !== selectedBoxId) }))
    setSelectedBoxId(null)
    setStatus('Selected redaction box removed.')
  }

  const clearCurrentImage = () => {
    updateSelectedItem((item) => ({ ...item, boxes: [] }))
    setSelectedBoxId(null)
    setStatus('All redaction boxes were cleared for the selected image.')
  }

  const removeImage = (imageId: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === imageId)
      if (target) {
        URL.revokeObjectURL(target.url)
      }
      const next = current.filter((item) => item.id !== imageId)
      if (selectedId === imageId) {
        setSelectedId(next[0]?.id ?? null)
        setSelectedBoxId(null)
      }
      return next
    })
  }

  const applySetting = <K extends keyof RedactionDefaults>(key: K, value: RedactionDefaults[K]) => {
    setDefaults((current) => ({ ...current, [key]: value }))
    if (selectedBoxId) {
      updateBox(selectedBoxId, (box) => ({ ...box, [key]: value }))
    }
  }

  const addCenteredBox = () => {
    if (!selectedItem) {
      return
    }
    const width = selectedItem.width * 0.28
    const height = selectedItem.height * 0.18
    addBox({
      x: selectedItem.width * 0.5 - width * 0.5,
      y: selectedItem.height * 0.5 - height * 0.5,
      width,
      height,
    })
  }

  const runFaceDetection = async () => {
    if (!selectedItem) {
      return
    }

    setBusy(true)
    const result = await detectFaces(selectedItem.image)
    if (result.boxes.length > 0) {
      const newBoxes = result.boxes.map((box) => (
        clampBox(createBox(box, defaults), selectedItem.width, selectedItem.height)
      ))
      updateSelectedItem((item) => ({ ...item, boxes: [...item.boxes, ...newBoxes] }))
      setSelectedBoxId(newBoxes[0]?.id ?? null)
    }
    setStatus(result.message)
    setBusy(false)
  }

  const downloadSelected = async () => {
    if (!selectedItem) {
      return
    }
    setBusy(true)
    try {
      const blob = await renderImageToBlob(selectedItem)
      downloadBlob(blob, `${safeFileStem(selectedItem.name)}-redacted.png`)
      setStatus('Redacted image exported as PNG without copying the original file metadata.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not export the selected image.')
    } finally {
      setBusy(false)
    }
  }

  const exportZip = async () => {
    if (items.length === 0) {
      return
    }
    setBusy(true)
    try {
      const blob = await createRedactedZip(items)
      downloadBlob(blob, 'redacted-images.zip')
      setStatus(`Exported ${items.length} redacted image${items.length === 1 ? '' : 's'} as a ZIP archive.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not export the ZIP archive.')
    } finally {
      setBusy(false)
    }
  }

  const modeValue = selectedBox?.mode ?? defaults.mode
  const blurValue = selectedBox?.blur ?? defaults.blur
  const pixelValue = selectedBox?.pixelSize ?? defaults.pixelSize
  const colorValue = selectedBox?.color ?? defaults.color

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Local-first privacy tool</p>
          <h1>Privacy Image Redactor</h1>
        </div>
        <div className="header-actions" aria-label="Primary actions">
          <button type="button" className="button primary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} aria-hidden="true" />
            Add images
          </button>
          <input
            ref={fileInputRef}
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(event) => handleFiles(Array.from(event.target.files ?? []))}
          />
        </div>
      </header>

      <section className="privacy-strip" aria-live="polite">
        <ShieldCheck size={20} aria-hidden="true" />
        <span>{status}</span>
      </section>

      <section
        className={`workspace ${dragActive ? 'is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragActive(false)
          handleFiles(Array.from(event.dataTransfer.files))
        }}
      >
        <aside className="panel queue-panel" aria-label="Image queue">
          <div className="panel-title-row">
            <div>
              <p className="label">Queue</p>
              <h2>{items.length} image{items.length === 1 ? '' : 's'}</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              title="Add images"
              aria-label="Add images"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} aria-hidden="true" />
            </button>
          </div>

          {items.length === 0 ? (
            <button type="button" className="drop-empty" onClick={() => fileInputRef.current?.click()}>
              <Upload size={26} aria-hidden="true" />
              <span>Drop images here or choose files</span>
            </button>
          ) : (
            <div className="queue-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`queue-item ${item.id === selectedId ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedId(item.id)
                    setSelectedBoxId(null)
                  }}
                >
                  <img src={item.url} alt="" />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.width} x {item.height} px · {fileSizeLabel(item.size)} · {item.boxes.length} boxes</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="editor-panel" aria-label="Canvas editor">
          {selectedItem ? (
            <>
              <div className="editor-toolbar">
                <div className="segmented" aria-label="Editing mode">
                  <button
                    type="button"
                    className={toolMode === 'select' ? 'is-active' : ''}
                    onClick={() => setToolMode('select')}
                  >
                    <MousePointer2 size={17} aria-hidden="true" />
                    Select
                  </button>
                  <button
                    type="button"
                    className={toolMode === 'box' ? 'is-active' : ''}
                    onClick={() => setToolMode('box')}
                  >
                    <Square size={17} aria-hidden="true" />
                    Draw box
                  </button>
                </div>
                <button type="button" className="button secondary" onClick={addCenteredBox}>
                  <Eraser size={17} aria-hidden="true" />
                  Add box
                </button>
                <button type="button" className="button secondary" onClick={runFaceDetection} disabled={busy}>
                  <ScanFace size={17} aria-hidden="true" />
                  Try face detection
                </button>
              </div>

              <ImageCanvas
                item={selectedItem}
                selectedBoxId={selectedBoxId}
                toolMode={toolMode}
                onAddBox={addBox}
                onSelectBox={setSelectedBoxId}
                onUpdateBoxes={updateBoxes}
                onNormalizeRect={normalizeRect}
              />
            </>
          ) : (
            <div className="empty-state">
              <EyeOff size={44} aria-hidden="true" />
              <h2>Redact before you publish</h2>
              <p>Drop your own image files or choose them from your device. No upload server is used.</p>
            </div>
          )}
        </section>

        <aside className="panel controls-panel" aria-label="Redaction controls">
          <div className="panel-title-row">
            <div>
              <p className="label">Redaction</p>
              <h2>{selectedBox ? 'Selected box' : 'New boxes'}</h2>
            </div>
            <SlidersHorizontal size={20} aria-hidden="true" />
          </div>

          <div className="control-group">
            <label>Mode</label>
            <div className="mode-grid">
              {([
                ['blur', 'Blur'],
                ['pixelate', 'Pixelate'],
                ['solid', 'Block'],
              ] as Array<[RedactionMode, string]>).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  className={modeValue === mode ? 'is-active' : ''}
                  onClick={() => applySetting('mode', mode)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label htmlFor="blur">Blur strength</label>
            <input
              id="blur"
              type="range"
              min="4"
              max="40"
              value={blurValue}
              onChange={(event) => applySetting('blur', Number(event.target.value))}
            />
            <span className="value-label">{blurValue}px</span>
          </div>

          <div className="control-group">
            <label htmlFor="pixel">Pixel block size</label>
            <input
              id="pixel"
              type="range"
              min="6"
              max="42"
              value={pixelValue}
              onChange={(event) => applySetting('pixelSize', Number(event.target.value))}
            />
            <span className="value-label">{pixelValue}px</span>
          </div>

          <div className="control-group">
            <label htmlFor="solid">Solid block color</label>
            <input
              id="solid"
              type="color"
              value={colorValue}
              onChange={(event) => applySetting('color', event.target.value)}
            />
          </div>

          <div className="action-stack">
            <button type="button" className="button danger" onClick={removeSelectedBox} disabled={!selectedBox}>
              <Trash2 size={17} aria-hidden="true" />
              Delete selected box
            </button>
            <button type="button" className="button secondary" onClick={clearCurrentImage} disabled={!selectedItem}>
              <Trash2 size={17} aria-hidden="true" />
              Clear current image
            </button>
            <button type="button" className="button secondary" onClick={() => selectedId && removeImage(selectedId)} disabled={!selectedItem}>
              <Trash2 size={17} aria-hidden="true" />
              Remove image
            </button>
          </div>

          <div className="export-box">
            <h3>Export</h3>
            <p>Canvas exports create new PNG files, so original EXIF metadata is not copied.</p>
            <button type="button" className="button primary wide" onClick={downloadSelected} disabled={!selectedItem || busy}>
              <Download size={17} aria-hidden="true" />
              Download selected
            </button>
            <button type="button" className="button secondary wide" onClick={exportZip} disabled={items.length === 0 || busy}>
              <Archive size={17} aria-hidden="true" />
              Export ZIP
            </button>
          </div>

          <div className="compat-box">
            <h3>Detection status</h3>
            <p>{isFaceDetectorSupported()
              ? 'Browser FaceDetector is available. A MediaPipe fallback may be used if needed; review every detected box.'
              : 'Browser FaceDetector is unavailable. A MediaPipe fallback will be tried when you run detection.'}</p>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default App
