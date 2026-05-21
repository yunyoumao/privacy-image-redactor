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

## Face Detection

The **Detect faces** button uses the browser's native `FaceDetector` API only when available. If the API is not supported, the app keeps working with manual redaction.

## Metadata

Exports are rendered from Canvas as new PNG files. This means normal EXIF metadata from the original upload is not copied into the exported image.
