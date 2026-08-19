export function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function rowsToCSV(rows) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(csvEscape).join(',')];
  rows.forEach(r => lines.push(headers.map(h => csvEscape(r[h])).join(',')));
  return lines.join('\n');
}

/** Very small CSV parser: handles quoted fields with embedded commas/quotes. */
export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',' || c === ';') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] ?? '').trim(); });
    return obj;
  });
}

function findColumn(row, candidates) {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const hit = keys.find(k => k.toLowerCase().trim() === c.toLowerCase());
    if (hit) return row[hit];
  }
  return undefined;
}

/** Normalizes parsed rows (from CSV or Excel) into {name, value, target, domain, sub, weight}. */
export function normalizeImportRows(rawRows) {
  return rawRows.map(row => {
    const name = findColumn(row, ['Indicateur', 'Name', 'KPI']);
    const valueRaw = findColumn(row, ['Réalisation', 'Realisation', 'Value', 'Valeur', 'Valeur (%)']);
    const targetRaw = findColumn(row, ['Objectif', 'Objectif (%)', 'Target', 'Target (%)']);
    const domainRaw = findColumn(row, ['Domaine', 'Domain']);
    const subRaw = findColumn(row, ['Sous-groupe', 'Sous groupe', 'Sub', 'Group', 'Groupe']);
    const weightRaw = findColumn(row, ['Poids', 'Poids (%)', 'Weight']);
    const value = parseFloat(String(valueRaw ?? '').replace(',', '.').replace('%', ''));
    const target = parseFloat(String(targetRaw ?? '').replace(',', '.').replace('%', ''));
    const weight = parseFloat(String(weightRaw ?? '').replace(',', '.').replace('%', ''));
    return {
      name: (name ?? '').trim(),
      value, target, weight,
      domain: (domainRaw ?? '').trim(),
      sub: (subRaw ?? '').trim(),
    };
  }).filter(r => r.name);
}
