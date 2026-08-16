/**
 * MULTI-BUSINESS CRM — GOOGLE APPS SCRIPT BACKEND
 * ------------------------------------------------
 * This script is the ONLY thing allowed to touch your Google Sheets.
 * The frontend (hosted on GitHub Pages) never talks to Google directly —
 * it calls this script's Web App URL instead. That keeps your actual
 * Google credentials off of GitHub entirely.
 *
 * SETUP STEPS ARE IN THE MAIN README.md — follow them in order.
 */

// ==================== 1. CONFIG ====================
// Map each business to its Google Sheet ID.
// The Sheet ID is the long string in the sheet's URL:
// https://docs.google.com/spreadsheets/d/THIS_PART_HERE/edit
const SHEET_MAP = {
  'gray-concrete':      '1eQhbQ1p2A_xM6MaF3gwEZgjNbulqfW3VfdA2cXZcBM8',
  'anointed-builders':  '10fVJFdiArQ9__1GbG_AaalT6iid7Bw5f8c5oocyKHUY',
  // Add up to 8 more as you build them. Just uncomment and fill in:
  // 'business-3': 'SHEET_ID_HERE',
  // 'business-4': 'SHEET_ID_HERE',
  // 'business-5': 'SHEET_ID_HERE',
  // 'business-6': 'SHEET_ID_HERE',
  // 'business-7': 'SHEET_ID_HERE',
  // 'business-8': 'SHEET_ID_HERE',
  // 'business-9': 'SHEET_ID_HERE',
  // 'business-10': 'SHEET_ID_HERE',
};

// Tab names INSIDE each business's spreadsheet. Change if yours differ.
const LEADS_TAB = 'Leads';
const BIDS_TAB = 'Bids';

// Allowed status values, in the order they should appear in the dropdown.
const STATUS_OPTIONS = ['Not Contacted', 'Contacted', 'Sent to Client', 'Booked'];

// ==================== 2. AUTH ====================
// The token is NOT stored in this file. You'll set it once in
// Project Settings > Script Properties (see README). This keeps it
// out of version control even though this .gs file may end up on GitHub.
function getToken_() {
  return PropertiesService.getScriptProperties().getProperty('APP_TOKEN');
}

function checkAuth_(token) {
  const real = getToken_();
  if (!real) throw new Error('Server misconfigured: no APP_TOKEN set in Script Properties.');
  if (token !== real) throw new Error('Unauthorized.');
}

// ==================== 3. ENTRY POINTS ====================
function doGet(e) {
  try {
    checkAuth_(e.parameter.token);
    const action = e.parameter.action;

    if (action === 'list') {
      return jsonOut_(getBusinessData_(e.parameter.business));
    }
    if (action === 'businesses') {
      return jsonOut_({ businesses: Object.keys(SHEET_MAP) });
    }
    return jsonOut_({ error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonOut_({ error: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    checkAuth_(body.token);

    if (body.action === 'updateStatus') {
      updateStatus_(body.business, body.sheetType, body.rowId, body.status);
      return jsonOut_({ success: true });
    }
    return jsonOut_({ error: 'Unknown action: ' + body.action });
  } catch (err) {
    return jsonOut_({ error: err.message });
  }
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== 4. SHEET LOGIC ====================
function getSheetId_(business) {
  const id = SHEET_MAP[business];
  if (!id || id.indexOf('PUT_') === 0) {
    throw new Error('Business "' + business + '" has no Sheet ID configured yet.');
  }
  return id;
}

function readTab_(spreadsheetId, tabName) {
  const ss = SpreadsheetApp.openById(spreadsheetId);
  const sheet = ss.getSheetByName(tabName);
  if (!sheet) return { headers: [], rows: [] };

  const values = sheet.getDataRange().getValues();
  if (values.length === 0) return { headers: [], rows: [] };

  let headers = values[0].map(h => String(h).trim());

  // Auto-add a Status column if the sheet doesn't have one yet.
  let statusCol = headers.indexOf('Status');
  if (statusCol === -1) {
    statusCol = headers.length;
    sheet.getRange(1, statusCol + 1).setValue('Status');
    headers.push('Status');
  }

  const rows = [];
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    if (row.join('') === '') continue; // skip fully blank rows
    const obj = { rowId: r + 1 }; // 1-based actual row number in the sheet
    headers.forEach((h, i) => {
      obj[h] = row[i] !== undefined ? row[i] : '';
    });
    if (!obj['Status']) obj['Status'] = 'Not Contacted';
    rows.push(obj);
  }
  return { headers: headers, rows: rows };
}

function getBusinessData_(business) {
  const id = getSheetId_(business);
  return {
    business: business,
    leads: readTab_(id, LEADS_TAB),
    bids: readTab_(id, BIDS_TAB),
    statusOptions: STATUS_OPTIONS
  };
}

function updateStatus_(business, sheetType, rowId, status) {
  if (STATUS_OPTIONS.indexOf(status) === -1) throw new Error('Invalid status: ' + status);
  const id = getSheetId_(business);
  const tabName = sheetType === 'bids' ? BIDS_TAB : LEADS_TAB;

  const ss = SpreadsheetApp.openById(id);
  const sheet = ss.getSheetByName(tabName);
  if (!sheet) throw new Error('Tab not found: ' + tabName);

  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  let statusCol = headers.indexOf('Status');
  if (statusCol === -1) {
    statusCol = headers.length;
    sheet.getRange(1, statusCol + 1).setValue('Status');
  }

  sheet.getRange(rowId, statusCol + 1).setValue(status);
}
