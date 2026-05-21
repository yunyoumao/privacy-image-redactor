# Privacy Boundary

Privacy Image Redactor is local-first:

- images are loaded into the browser from local files;
- redaction is rendered with Canvas;
- exports are new PNG files, so typical original image metadata is not copied;
- ZIP export is created in the browser.
- automatic face detection runs in the browser. The MediaPipe fallback may download public model/wasm assets, but the selected image is not uploaded by the app.

Important limits:

- Browser `FaceDetector` support varies by browser and platform.
- Automatic detection is only a convenience feature; ID cards, screenshots, small portraits, angled faces, and low-resolution images can be missed.
- Manual review is required.
- Canvas export is not a forensic erasure certification.
- Very large images can use significant memory.
- Do not rely on this tool as the only control for regulated, legal, medical, or classified material.

Recommended workflow:

1. Redact every face and private region.
2. Export the image or ZIP.
3. Open the exported files and inspect them manually.
4. Share only the inspected exports.
