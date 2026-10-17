# Zi_LINK (PWA)

Gallery for your Google Sheet links + add/edit + share-to-add. All personal values live in **⚙️ Settings** (saved in the browser only), not in the code.

## Publish on GitHub Pages
1. New repo → upload everything in this folder (`index.html`, `sw.js`, `manifest.webmanifest`, `icons/`).
2. Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / root.
3. Open `https://<user>.github.io/<repo>/` → ⚙️ → paste the sheet link + the Apps Script link → Save.
4. Chrome menu → *Install app* (Android: this also enables Share → Zi_LINK).

## Settings
- **Google Sheet link**: any link to the sheet tab (ID and gid are extracted). Must be shared as "Anyone with the link – Viewer".
- **Add/Edit endpoint**: the Apps Script Web App `/exec` link.
- **Add from any page (Chrome desktop)**: drag the ➕ button to the bookmarks bar; click it on any page to add that page (images/videos/text picker, like the extension).
- **Advanced → Sheet tab name**: your Apps Script finds the tab by name (`getSheetByName`), so it must match the tab (default `List`).
- **Edit password**: optional.
- **Copy setup link**: puts the settings in the URL `#cfg=…` so a second device gets them in one tap. Keep it private.

## Updating
Change `index.html`, then bump `VERSION` in `sw.js` so installed copies refresh.

## Share from your phone (Android)
Install the app from Chrome (menu → Install app). Then in any app: Share → Zi_LINK. The Add form opens with the title/link filled (YouTube/TikTok/Vimeo also fill the thumbnail). Set the Apps Script link in Settings first. iOS Safari does not support share targets.
