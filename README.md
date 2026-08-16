# Multi-Business CRM (Leads + Bids, synced to Google Sheets)

## How it actually works

```
Your browser (GitHub Pages)  <--fetch-->  Google Apps Script Web App  <--native-->  Your Google Sheets
      (web/ folder)                        (apps-script/Code.gs)
```

The frontend never touches Google's API directly. It calls a small script
that lives inside Google's own infrastructure, which is the only piece
authorized to read/write your sheets. This keeps real Google credentials
out of your public GitHub repo.

**One deployment of Code.gs serves all 10 businesses** — you're just adding
rows to a lookup table (`SHEET_MAP`) as you build each one out. No new
backend needed for business #3 through #10.

---

## Requirements for each business's Google Sheet

Each business needs its own spreadsheet with two tabs, named exactly:
- `Leads`
- `Bids`

Each tab needs a header row (row 1) with column names — whatever columns you
already use (Name, Phone, Email, Notes, Bid Amount, etc.). **Do not add a
"Status" column yourself — the app creates and manages it automatically.**

---

## Setup — do this once

### 1. Create/open your two spreadsheets
Grab the Sheet ID from each URL:
`https://docs.google.com/spreadsheets/d/`**`THIS_LONG_STRING`**`/edit`

### 2. Create the Apps Script backend
1. Go to https://script.google.com → **New project**.
2. Delete the default code, paste in the contents of `apps-script/Code.gs`.
3. In `SHEET_MAP`, replace the placeholder strings with your real Sheet IDs
   for `gray-concrete` and `anointed-builders`.
4. Save the project (name it something like "CRM Backend").

### 3. Set your secret token
1. In the Apps Script editor: **Project Settings** (gear icon, left sidebar).
2. Scroll to **Script Properties** → **Add script property**.
3. Property: `APP_TOKEN`, Value: any long random string you make up
   (e.g. `crm-8f3k2m9x-secret`). This is your app's password — nobody but
   your frontend should have it.

### 4. Deploy as a Web App
1. Click **Deploy → New deployment**.
2. Click the gear next to "Select type" → **Web app**.
3. Execute as: **Me**. Who has access: **Anyone**.
   (This does *not* make your sheets public — every request still requires
   the token from step 3. "Anyone" here means "anyone with the URL and the
   token," which is your frontend.)
4. Click **Deploy**, authorize the permissions it asks for (it needs access
   to your own Sheets).
5. Copy the **Web app URL** it gives you — looks like
   `https://script.google.com/macros/s/AKfycb.../exec`.

### 5. Wire up the frontend
Open `web/config.js` and fill in:
```js
webAppUrl: 'https://script.google.com/macros/s/AKfycb.../exec',
token: 'crm-8f3k2m9x-secret',
```
(same token you set in step 3).

### 6. Push to GitHub and turn on Pages
```bash
cd crm-app
git init
git add .
git commit -m "Initial CRM app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```
Then on GitHub: **Settings → Pages → Source: Deploy from branch → Branch:
main, folder: /web → Save.**

GitHub gives you a URL like `https://YOUR_USERNAME.github.io/YOUR_REPO/` —
that's your app.

---

## Adding businesses 3–10 later
For each new business:
1. Create its spreadsheet with `Leads` and `Bids` tabs (see requirements above).
2. In `Code.gs`, add a line to `SHEET_MAP`, e.g. `'business-3': 'ITS_SHEET_ID'`.
   Re-deploy the Apps Script (**Deploy → Manage deployments → Edit → New version**).
3. In `config.js`, rename the matching placeholder business (`business-3`,
   etc.) to the real name.
4. Commit and push — GitHub Pages updates automatically.

No new infrastructure, no new URL, no new token. Same deployment handles all 10.

---

## Security notes — read this before you decide the repo can be public

- `config.js` ships your `APP_TOKEN` to anyone who visits the page or views
  source. That's expected — it's the equivalent of an API key for an
  internal tool, not a login system.
- **[Recommendation] Make the GitHub repo private**, or at minimum put the
  app behind GitHub Pages' built-in visibility settings if you're on a paid
  plan. A public repo + public Pages site means anyone who finds it can
  read and edit your leads/bids if they extract the token from the JS.
- If the token ever leaks, change the `APP_TOKEN` Script Property and update
  `config.js` — takes under a minute, no data is lost.
- This has no login screen. It's built for "only people I hand the URL to"
  trust, not public internet trust. If you eventually want real user
  accounts, that's a different (bigger) build — say so and I'll scope it.

---

## Status values
`Not Contacted → Contacted → Sent to Client → Booked`

Changing the dropdown on any row writes immediately back to the
corresponding row in the actual Google Sheet — no separate "save" step.

## Refresh
The **⟳ Refresh** button re-pulls Leads and Bids for whichever business tab
is currently selected, so you see edits made directly in Google Sheets
too — sync is two-way.
