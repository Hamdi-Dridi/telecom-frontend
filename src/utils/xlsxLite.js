/* =======================================================================
   xlsxLite — a tiny, dependency-free .xlsx reader/writer.
   Uses only browser-native APIs: DecompressionStream/CompressionStream
   (for the ZIP container) and DOMParser (for the OOXML/SpreadsheetML
   parts). No CDN, no npm package, works fully offline.

   Supports the common case: a single-sheet workbook with a header row —
   exactly what this app reads and writes. It is not a general-purpose
   spreadsheet engine (no formulas, styles, multiple sheets, merged cells).
   ========================================================================= */

export function xlsxSupported() {
  return typeof DecompressionStream !== 'undefined' && typeof CompressionStream !== 'undefined';
}

/* ---------------------------------------------------------------------
   ZIP container — read side
--------------------------------------------------------------------- */
async function inflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function deflateRaw(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function unzipIndex(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  let eocdOffset = -1;
  const minOffset = Math.max(0, bytes.length - 22 - 65536); // comment can be up to 64KB
  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocdOffset = i; break; }
  }
  if (eocdOffset === -1) throw new Error("Fichier ZIP invalide (fin d'archive introuvable).");

  const entryCount = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);

  const entries = {};
  let offset = centralDirOffset;
  for (let i = 0; i < entryCount; i++) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compSize = view.getUint32(offset + 20, true);
    const nameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLen));
    entries[name] = { method, compSize, localHeaderOffset };
    offset += 46 + nameLen + extraLen + commentLen;
  }
  return { bytes, view, entries };
}

async function extractEntry(zip, name) {
  const entry = zip.entries[name];
  if (!entry) return null;
  const { view, bytes } = zip;
  const lh = entry.localHeaderOffset;
  const nameLen = view.getUint16(lh + 26, true);
  const extraLen = view.getUint16(lh + 28, true);
  const dataStart = lh + 30 + nameLen + extraLen;
  const compData = bytes.slice(dataStart, dataStart + entry.compSize);
  if (entry.method === 0) return compData;
  if (entry.method === 8) return await inflateRaw(compData);
  throw new Error('Méthode de compression ZIP non supportée dans ce fichier (' + entry.method + ').');
}

/* ---------------------------------------------------------------------
   SpreadsheetML parsing
--------------------------------------------------------------------- */
function parseSharedStrings(xmlText) {
  if (!xmlText) return [];
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  return Array.from(doc.getElementsByTagName('si')).map(si =>
    Array.from(si.getElementsByTagName('t')).map(t => t.textContent).join('')
  );
}

function colLetterToIndex(ref) {
  const m = ref.match(/^[A-Z]+/);
  if (!m) return -1;
  let idx = 0;
  for (const ch of m[0]) idx = idx * 26 + (ch.charCodeAt(0) - 64);
  return idx - 1;
}

function parseSheetGrid(xmlText, sharedStrings) {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml');
  const rowEls = Array.from(doc.getElementsByTagName('row'));
  return rowEls.map(rowEl => {
    const rowArr = [];
    Array.from(rowEl.getElementsByTagName('c')).forEach((c, fallbackIdx) => {
      const ref = c.getAttribute('r');
      const colIdx = ref ? colLetterToIndex(ref) : fallbackIdx;
      const type = c.getAttribute('t');
      let value = '';
      if (type === 's') {
        const v = c.getElementsByTagName('v')[0];
        const idx = v ? parseInt(v.textContent, 10) : -1;
        value = sharedStrings[idx] ?? '';
      } else if (type === 'inlineStr') {
        const is = c.getElementsByTagName('is')[0];
        value = is ? Array.from(is.getElementsByTagName('t')).map(t => t.textContent).join('') : '';
      } else {
        const v = c.getElementsByTagName('v')[0];
        value = v ? v.textContent : '';
      }
      if (colIdx >= 0) rowArr[colIdx] = value;
    });
    for (let i = 0; i < rowArr.length; i++) if (rowArr[i] === undefined) rowArr[i] = '';
    return rowArr;
  });
}

async function resolveFirstSheetPath(zip) {
  try {
    const wbBytes = await extractEntry(zip, 'xl/workbook.xml');
    const relsBytes = await extractEntry(zip, 'xl/_rels/workbook.xml.rels');
    if (!wbBytes || !relsBytes) return 'xl/worksheets/sheet1.xml';
    const wbDoc = new DOMParser().parseFromString(new TextDecoder().decode(wbBytes), 'application/xml');
    const firstSheet = wbDoc.getElementsByTagName('sheet')[0];
    const rId = firstSheet?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')
      || firstSheet?.getAttribute('r:id');
    const relsDoc = new DOMParser().parseFromString(new TextDecoder().decode(relsBytes), 'application/xml');
    const rel = Array.from(relsDoc.getElementsByTagName('Relationship')).find(r => r.getAttribute('Id') === rId);
    const target = rel?.getAttribute('Target');
    if (!target) return 'xl/worksheets/sheet1.xml';
    return target.startsWith('/') ? target.slice(1) : 'xl/' + target.replace(/^\.?\//, '');
  } catch (e) {
    return 'xl/worksheets/sheet1.xml';
  }
}

/** Reads the first sheet of an .xlsx file into an array of row objects
 *  keyed by the header row — same shape as SheetJS's sheet_to_json(). */
export async function readXlsx(arrayBuffer) {
  if (!xlsxSupported()) {
    throw new Error("Votre navigateur ne supporte pas la lecture de fichiers Excel en local. Utilisez un fichier CSV, ou un navigateur à jour (Chrome, Edge, Firefox récents).");
  }
  const zip = unzipIndex(arrayBuffer);
  const sheetPath = await resolveFirstSheetPath(zip);
  const sharedBytes = await extractEntry(zip, 'xl/sharedStrings.xml');
  const sharedStrings = sharedBytes ? parseSharedStrings(new TextDecoder().decode(sharedBytes)) : [];
  const sheetBytes = await extractEntry(zip, sheetPath);
  if (!sheetBytes) throw new Error('Feuille de calcul introuvable dans ce fichier .xlsx.');
  const grid = parseSheetGrid(new TextDecoder().decode(sheetBytes), sharedStrings);
  if (grid.length === 0) return [];
  const headers = grid[0].map(h => String(h ?? '').trim());
  return grid.slice(1)
    .filter(r => r.some(v => v !== '' && v != null))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = r[i] ?? ''; });
      return obj;
    });
}

/* ---------------------------------------------------------------------
   ZIP container — write side (entries stored uncompressed: simpler and
   fully valid ZIP; these files are tiny so the size cost is negligible)
--------------------------------------------------------------------- */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();
function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function buildZip(files) {
  const encoder = new TextEncoder();
  const now = new Date();
  const dosTime = ((now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)) & 0xFFFF;
  const dosDate = (((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()) & 0xFFFF;

  const localParts = [], centralParts = [];
  let offset = 0;

  files.forEach(f => {
    const nameBytes = encoder.encode(f.name);
    const data = f.data;
    const crc = crc32(data);
    const size = data.length;

    const local = new Uint8Array(30 + nameBytes.length + size);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); // method: stored
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length;
  });

  const centralOffset = offset;
  const centralSize = centralParts.reduce((a, p) => a + p.length, 0);

  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, centralOffset, true);

  return new Blob([...localParts, ...centralParts, eocd], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function xmlEscape(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
}

function colIndexToLetter(i) {
  let s = '';
  i += 1;
  while (i > 0) { const r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); }
  return s;
}

function buildSheetXml(rows) {
  if (rows.length === 0) return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData/></worksheet>';
  const headers = Object.keys(rows[0]);
  const allRows = [headers, ...rows.map(r => headers.map(h => r[h]))];
  const xmlRows = allRows.map((cells, rIdx) => {
    const cellsXml = cells.map((val, cIdx) => {
      const ref = colIndexToLetter(cIdx) + (rIdx + 1);
      const isNumber = typeof val === 'number' && isFinite(val);
      if (isNumber) return `<c r="${ref}"><v>${val}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(val)}</t></is></c>`;
    }).join('');
    return `<row r="${rIdx + 1}">${cellsXml}</row>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${xmlRows}</sheetData></worksheet>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;
const ROOT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
const WORKBOOK_XML = (sheetName) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xmlEscape(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`;
const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;

/** Builds a valid single-sheet .xlsx Blob from an array of row objects. */
export function writeXlsx(rows, sheetName = 'Feuille1') {
  const encoder = new TextEncoder();
  const files = [
    { name: '[Content_Types].xml', data: encoder.encode(CONTENT_TYPES) },
    { name: '_rels/.rels', data: encoder.encode(ROOT_RELS) },
    { name: 'xl/workbook.xml', data: encoder.encode(WORKBOOK_XML(sheetName)) },
    { name: 'xl/_rels/workbook.xml.rels', data: encoder.encode(WORKBOOK_RELS) },
    { name: 'xl/worksheets/sheet1.xml', data: encoder.encode(buildSheetXml(rows)) },
  ];
  return buildZip(files);
}

export function downloadXlsx(rows, filename, sheetName) {
  const blob = writeXlsx(rows, sheetName);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
