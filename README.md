# Zi_LINK (PWA for Android)

https://zihegazi.github.io/zi-links/

Upload ALL of these files to the root of the GitHub repo (no subfolders):
`index.html`, `add.html`, `sw.js`, `manifest.webmanifest`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`

- Opening the app icon -> `index.html` (the gallery).
- Share a link from any Android app -> Zi_LINK -> `add.html` (a separate Add page, no gallery). Save or Cancel closes it and returns you to the app you were in. It uses the same Settings and the same edit password as the gallery.
- Settings (the logo button in the gallery): sheet link (needs `gid`), Apps Script link, edit password, auto-fill on/off.
- Updating: change the files, then bump `VERSION` in `sw.js`.

## Apps Script (`Code.gs`)
- Paste `Code.gs` into the sheet's Apps Script (Extensions > Apps Script), then Deploy > Manage deployments > Edit > New version > Deploy (Execute as: Me, Access: Anyone). Authorize again when asked.
- The app sends the spreadsheet ID (`sid`) from the Settings sheet link with every add/edit, so the script writes to the sheet you linked in the app. If `sid` is missing it uses the sheet the script is attached to.
- Self-test in the browser: `<script link>?action=check&sid=<sheet id>&gid=<gid>` -> shows the sheet name and any missing columns.
- Sheet columns (header names, row 1): `title, link, image, vid, type, rate, note, row`.
