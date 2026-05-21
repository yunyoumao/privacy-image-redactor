# Usage

## Local Development

```bash
npm install
npm run dev
```

## Basic Workflow

1. Drop images into the queue or click **Add images**.
2. Select an image from the queue.
3. Draw boxes over faces, names, account IDs, screenshots, or other private regions.
4. Choose `Blur`, `Pixelate`, or `Block`.
5. Download the selected image or export all images as a ZIP.

Supported upload formats are PNG, JPEG, and WebP. SVG files are kept out of the upload flow to avoid external-resource and scripting ambiguity.

## Automatic Face Detection

The **Try face detection** button first uses the browser's native `FaceDetector` API when available. If that does not find faces or is not supported, the app tries a MediaPipe Face Detector fallback in the browser.

This is still an assistant feature, not a guarantee. ID cards, screenshots, small embedded portraits, angled faces, and low-resolution images can be missed. Always inspect the image and add manual boxes before export.

## Metadata

Exports are rendered from Canvas as new PNG files. This means normal EXIF metadata from the original upload is not copied into the exported image.
