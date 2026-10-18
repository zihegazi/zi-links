# Zi_LINK (PWA for Android)

Upload ALL of these files to the root of the GitHub repo (no subfolders):
`index.html`, `add.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`

- Opening the app icon -> `index.html` (the gallery).
- Share a link from any Android app -> Zi_LINK -> `add.html` (a separate Add page, no gallery). Save or Cancel closes it and returns you to the app you were in.
- Settings (the logo button in the gallery): sheet link (needs `gid`), Apps Script link, edit password, auto-fill on/off.
- Updating: change the files, then bump `VERSION` in `sw.js`.
