// ==================== CONNECTION SETTINGS ====================
// Fill these in after you deploy the Apps Script (see README.md steps 4-6).
const CONFIG = {
  webAppUrl: 'https://script.google.com/macros/s/AKfycbwlAllAG0MYsB8oxMGyRiItkyXfmqQuGA8jMZSQ3FyHBfyE6ZXVjeYdb6qVa8BtFNFxxA/exec',
  token: 'DrawoH1985()', // must match Script Properties > APP_TOKEN

  // ==================== BUSINESS LIST ====================
  // id must exactly match a key in SHEET_MAP inside Code.gs
  // Only the first two are wired to real sheets today — the other 8
  // are placeholders so the UI is already scaled for your full plan.
  // Delete/rename slots as you build each business out.
  businesses: [
    { id: 'gray-concrete',     name: 'Gray Concrete Co' },
    { id: 'anointed-builders', name: 'Anointed Builders' },
    { id: 'accurate-builders-repair', name: 'Accurate Builders Repair' },
    { id: 'business-4',        name: 'Business 4' },
    { id: 'business-5',        name: 'Business 5' },
    { id: 'business-6',        name: 'Business 6' },
    { id: 'business-7',        name: 'Business 7' },
    { id: 'business-8',        name: 'Business 8' },
    { id: 'business-9',        name: 'Business 9' },
    { id: 'business-10',       name: 'Business 10' }
  ]
};
