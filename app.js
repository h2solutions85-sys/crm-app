let currentBusiness = CONFIG.businesses[0].id;
let currentData = null;

document.addEventListener('DOMContentLoaded', () => {
  renderBusinessList();
  loadData(currentBusiness);
  document.getElementById('refreshBtn').addEventListener('click', () => loadData(currentBusiness, true));
});

function currentBusinessName() {
  const b = CONFIG.businesses.find(b => b.id === currentBusiness);
  return b ? b.name : currentBusiness;
}

function renderBusinessList() {
  const nav = document.getElementById('businessList');
  nav.innerHTML = '';
  CONFIG.businesses.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'biz-btn' + (b.id === currentBusiness ? ' active' : '');
    btn.innerHTML = `<span class="biz-dot"></span><span>${escapeHtml(b.name)}</span>`;
    btn.onclick = () => {
      currentBusiness = b.id;
      renderBusinessList();
      loadData(currentBusiness);
    };
    nav.appendChild(btn);
  });
  document.getElementById('businessTitle').textContent = currentBusinessName();
}

async function loadData(business, isRefresh) {
  setStatus('Loading…');
  document.getElementById('leadsTable').innerHTML = '';
  document.getElementById('bidsTable').innerHTML = '';
  try {
    if (CONFIG.webAppUrl.indexOf('PASTE_') === 0) {
      throw new Error('Set webAppUrl and token in config.js first (see README).');
    }
    const url = `${CONFIG.webAppUrl}?action=list&business=${encodeURIComponent(business)}&token=${encodeURIComponent(CONFIG.token)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    currentData = data;
    renderTable('leadsTable', data.leads, 'leads');
    renderTable('bidsTable', data.bids, 'bids');
    setStatus(isRefresh ? 'Refreshed ' + new Date().toLocaleTimeString() : '');
  } catch (err) {
    setStatus('Error: ' + err.message, true);
  }
}

function setStatus(msg, isError) {
  const el = document.getElementById('statusMsg');
  el.textContent = msg;
  el.className = isError ? 'status-msg error' : 'status-msg';
}

function renderTable(tableId, sheetData, sheetType) {
  const table = document.getElementById(tableId);
  table.innerHTML = '';
  if (!sheetData || !sheetData.headers || sheetData.headers.length === 0) {
    table.innerHTML = '<tr><td class="empty-note">No data found for this business yet.</td></tr>';
    return;
  }

  const headers = sheetData.headers;

  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  sheetData.rows.forEach(row => {
    const tr = document.createElement('tr');
    headers.forEach(h => {
      const td = document.createElement('td');
      if (h === 'Status') {
        td.appendChild(buildStatusPill(row, sheetType));
      } else {
        td.textContent = row[h];
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

function buildStatusPill(row, sheetType) {
  const wrapper = document.createElement('div');
  wrapper.className = 'status-pill status-' + slug(row['Status']);

  const dot = document.createElement('span');
  dot.className = 'status-dot';
  wrapper.appendChild(dot);

  const select = document.createElement('select');
  select.className = 'status-select';
  (currentData.statusOptions || []).forEach(opt => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    if (row['Status'] === opt) o.selected = true;
    select.appendChild(o);
  });
  select.addEventListener('change', (e) => {
    updateStatus(sheetType, row.rowId, e.target.value, wrapper, select);
  });
  wrapper.appendChild(select);
  return wrapper;
}

function slug(s) {
  return (s || '').toLowerCase().replace(/\s+/g, '-');
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function updateStatus(sheetType, rowId, status, wrapperEl, selectEl) {
  selectEl.disabled = true;
  try {
    // No custom headers on this fetch — intentional. Setting
    // Content-Type: application/json triggers a CORS preflight that
    // Apps Script Web Apps don't handle. Plain-text body + server-side
    // JSON.parse avoids that entirely.
    const res = await fetch(CONFIG.webAppUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateStatus',
        business: currentBusiness,
        sheetType: sheetType,
        rowId: rowId,
        status: status,
        token: CONFIG.token
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    wrapperEl.className = 'status-pill status-' + slug(status);
    setStatus('Saved to Google Sheet ✓ ' + new Date().toLocaleTimeString());
  } catch (err) {
    setStatus('Failed to save: ' + err.message, true);
  } finally {
    selectEl.disabled = false;
  }
}
