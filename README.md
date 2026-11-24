# MechCAD Viewer

An open-source, mobile-friendly 3D mechanical modelling workspace prototype.

## Current prototype features
- 3D viewport with orbit, zoom and pan controls
- Add box, cylinder and sphere primitives
- Select solids in the viewport or model tree
- Inspect object position and bounding dimensions
- Delete selected object, reset scene, toggle grid and axes
- Responsive layout for Android phones and desktop browsers

## Run locally
This project uses JavaScript ES modules, so serve the folder using a local web server. Opening `index.html` directly as a `file://` URL may block module imports.

## Publish with GitHub Pages
1. Upload the contents of this folder to the root of your GitHub repository.
2. In repository Settings → Pages, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then Save.
4. Open `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

## Important engineering note
This is an early 3D visualization and primitive-editing prototype built with Three.js. It is **not yet a parametric CAD kernel** and does not currently create or export STEP files. Future development will add sketch constraints, feature-based solid modelling and CAD-kernel integration.

## Technology
- Three.js for 3D rendering and interaction
- ES modules loaded from jsDelivr CDN
- HTML and CSS for the mobile interface

## License
MIT. See `LICENSE`.
