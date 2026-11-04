/**
 * Zi_LINK — Apps Script Web App
 *  POST {action:"add",  sid, gid, title, link, image, vid, type, rate, note}
 *  POST {action:"edit", sid, gid, row, title, link, image, vid, type, rate, note}
 *  GET  ?action=scrape&url=...   -> {ok:true, html:"..."}  (fetches a page server-side; writes nothing)
 *  GET  ?action=check&sid=...&gid=...  -> {ok:true, sheet:"List", missing:[...]}  (writes nothing)
 *
 * sid = the spreadsheet ID from the app's Settings (the Google Sheet link).
 * The script opens THAT spreadsheet. If sid is empty it falls back to the spreadsheet this script is attached to.
 *
 * Deploy: Deploy > New deployment > Web app > Execute as: Me > Who has access: Anyone
 * After pasting a new version of this file: Deploy > Manage deployments > Edit > New version > Deploy.
 * (The first deploy of this version asks you to authorize again — that is expected, it needs access to the sheet by ID.)
 */

var FIELDS = ["title", "link", "image", "vid", "type", "rate", "note"]; // sheet columns we write (matched by header name)

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// The spreadsheet from the app's Settings; falls back to the one this script lives in
function getSpreadsheet_(sid) {
  sid = String(sid || "").trim();
  var active = null;
  try { active = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) {}
  if (sid && (!active || active.getId() !== sid)) return SpreadsheetApp.openById(sid);
  if (!active) throw new Error("No spreadsheet: send sid, or attach this script to the sheet");
  return active;
}

function getSheetByGid_(ss, gid) {
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (String(sheets[i].getSheetId()) === String(gid)) return sheets[i];
  }
  return null;
}

function headerMap_(sheet) {
  var lastCol = sheet.getLastColumn();
  var map = {};
  if (lastCol < 1) return map;
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim().toLowerCase();
    if (h && !(h in map)) map[h] = i + 1; // 1-based column index
  }
  return map;
}

// last row that actually has a title or a link (ignores rows that only hold formulas such as =ROW())
function lastDataRow_(sheet, cols) {
  var last = sheet.getLastRow();
  if (last < 2) return 1;
  var idxs = [cols.title, cols.link, cols.image, cols.vid].filter(Boolean);
  var best = 1;
  idxs.forEach(function (c) {
    var vals = sheet.getRange(2, c, last - 1, 1).getValues();
    for (var r = vals.length - 1; r >= 0; r--) {
      if (String(vals[r][0]).trim() !== "") { if (r + 2 > best) best = r + 2; break; }
    }
  });
  return best;
}

function writeFields_(sheet, row, cols, data, onlyProvided) {
  FIELDS.forEach(function (f) {
    if (!cols[f]) return;
    if (onlyProvided && !(f in data)) return;
    var v = data[f] == null ? "" : String(data[f]);
    // a value starting with "=" would be run as a formula; the leading ' keeps it as plain text
    if (v.charAt(0) === "=") v = "'" + v;
    sheet.getRange(row, cols[f]).setValue(v);
  });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var ss = getSpreadsheet_(data.sid);
    var sheet = getSheetByGid_(ss, data.gid);
    if (!sheet) return json_({ ok: false, error: "Sheet not found for gid " + data.gid });
    var cols = headerMap_(sheet);

    if (data.action === "add") {
      var row = lastDataRow_(sheet, cols) + 1;
      // the sheet may be completely full (every row used): add the missing rows first
      var max = sheet.getMaxRows();
      if (row > max) sheet.insertRowsAfter(max, row - max);
      writeFields_(sheet, row, cols, data, false);
      SpreadsheetApp.flush();
      return json_({ ok: true, row: row });
    }

    if (data.action === "edit") {
      var r = Number(data.row);
      if (!isFinite(r) || r < 2 || r > sheet.getLastRow() || Math.floor(r) !== r) {
        return json_({ ok: false, error: "Invalid row number" });
      }
      writeFields_(sheet, r, cols, data, true);
      SpreadsheetApp.flush();
      return json_({ ok: true, row: r });
    }

    return json_({ ok: false, error: "Unknown action: " + data.action });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};

  if (p.action === "scrape") {
    try {
      var url = String(p.url || "");
      if (!/^https?:\/\//i.test(url)) return json_({ ok: false, error: "Bad url" });
      var res = UrlFetchApp.fetch(url, {
        followRedirects: true,
        muteHttpExceptions: true,
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9,ar;q=0.8"
        }
      });
      return json_({ ok: true, status: res.getResponseCode(), html: res.getContentText().slice(0, 1500000) });
    } catch (err) {
      return json_({ ok: false, error: String(err) });
    }
  }

  // quick self-test from the browser: .../exec?action=check&sid=SHEET_ID&gid=GID
  if (p.action === "check") {
    try {
      var ss = getSpreadsheet_(p.sid);
      var sheet = getSheetByGid_(ss, p.gid);
      if (!sheet) return json_({ ok: false, error: "Sheet not found for gid " + p.gid });
      var cols = headerMap_(sheet);
      var missing = FIELDS.concat(["row"]).filter(function (f) { return !cols[f]; });
      return json_({ ok: true, spreadsheet: ss.getName(), sheet: sheet.getName(), missing: missing });
    } catch (err) {
      return json_({ ok: false, error: String(err) });
    }
  }

  return json_({ ok: true, msg: "Zi_LINK script is running" });
}
