// Rebuilds the revenue register (revenue-rows.js, revenue-data.js) from the Revenue_r feed CSV
// and splices both into index.html.  No dependencies.
//
//   node tools/build-revenue.js <feed.csv> [repoDir] [--all-from-feed]
//
// Source: "Revenue_r" tab of NRR Reports, mirrored by IMPORTRANGE into the feeder sheet.
// Revenue = "Untaxed Amount Signed" (taxable, functional currency, credit notes negative).
// Only Fiscal_year 2024, 2025, 2026 (FY 24-25 .. FY 26-27) are loaded.
// Invoices already in the register keep their dimensions (customer, team, state, ...);
// amount, payment status, amount due, ageing and delay are refreshed from the feed every run.
// New invoices are built from the feed; a blank sales team / state is filled from history.
'use strict';
const fs = require('fs'), path = require('path');
const [, , FEED, DIR = '.', FLAG] = process.argv;
const ALL = FLAG === '--all-from-feed';
const FY = ['2024', '2025', '2026'];
const die = m => { console.error('ABORT: ' + m); process.exit(2); };

// ---------- CSV ----------
function parseCSV(t) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const num = v => { if (v == null) return 0; const s = String(v).replace(/,/g, '').trim(); if (s === '' || s === '-') return 0; const n = +s; return isFinite(n) ? n : 0; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function toDate(v) { // -> Date (UTC) or null
  if (v == null) return null; const s = String(v).trim(); if (!s || s === '0') return null;
  let m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})/); if (m) return new Date(Date.UTC(+m[3], MON.indexOf(m[2][0].toUpperCase() + m[2].slice(1, 3).toLowerCase()), +m[1]));
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/); if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = s.match(/^([A-Za-z]+)[- ](\d{4})$/);        // "September-2026", "December 2024", "Nov-2026"
  if (m) { const k = MON.indexOf(m[1][0].toUpperCase() + m[1].slice(1, 3).toLowerCase()); if (k >= 0) { const d = new Date(Date.UTC(+m[2], k, 1)); d.monthOnly = true; return d; } }
  m = s.match(/^(\d{4})-(\d{2})$/);               // "2024-04"
  if (m) { const d = new Date(Date.UTC(+m[1], +m[2] - 1, 1)); d.monthOnly = true; return d; }
  return null;
}
const fmt = (d, blank) => d ? String(d.getUTCDate()).padStart(2, '0') + ' ' + MON[d.getUTCMonth()] + ' ' + String(d.getUTCFullYear()).slice(2) : blank;
const r2 = x => Math.round(x * 100) / 100;

// ---------- load current register ----------
const P = f => path.join(DIR, f);
const rrTxt = fs.readFileSync(P('revenue-rows.js'), 'utf8'), rdTxt = fs.readFileSync(P('revenue-data.js'), 'utf8');
global.window = {}; eval(rrTxt); eval(rdTxt);
const R = window.REVROWS, V = window.REVENUE, F = R.fields, ix = n => F.indexOf(n);
const E = ['India', 'Dubai', 'USA'];
const dv = (f, i) => (R.dict[f] ? R.dict[f][i] : i);
const di = (f, v) => { v = v == null ? '' : String(v); let i = R.dict[f].indexOf(v); if (i < 0) { R.dict[f].push(v); i = R.dict[f].length - 1; } return i; };

// ---------- feed ----------
const csv = parseCSV(fs.readFileSync(FEED, 'utf8'));
const H = csv[0].map(h => h.trim()), c = n => { const i = H.indexOf(n); if (i < 0) die('feed column missing: ' + n); return i; };
const need = ['Number', 'Invoice Partner Display Name', 'Customer State', 'Customer Country', 'Invoice/Bill Date', 'Untaxed Amount Signed',
  'Salesperson', 'Sales Team', 'Company', 'Status In Payment', 'Fiscal_year', 'Amount Due', 'Due Date', 'Category',
  'untaxed_amount_in_usd', 'Days_outstanding', 'aging_bucket', 'Payment_date', 'days', 'aging_bucket_late',
  'untaxed_amount_status', 'Region', 'Month Year', 'so number', 'SO Order Date', 'PO Receive Date'];
const C = Object.fromEntries(need.map(n => [n, c(n)]));
const feed = new Map();
for (const r of csv.slice(1)) {
  const id = (r[C['Number']] || '').trim();
  if (!id || !FY.includes(String(r[C['Fiscal_year']]).trim())) continue;
  if (feed.has(id)) die('duplicate invoice in feed: ' + id);
  feed.set(id, r);
}
const base = R.rows.length;
if (feed.size < 1000) die(`feed has only ${feed.size} FY24-26 invoices (IMPORTRANGE broken?)`);
if (!ALL && feed.size < base * 0.95) die(`feed has ${feed.size} invoices vs ${base} in the app — more than 5% fewer`);

const ent = s => /FZE/i.test(s) ? 1 : /Corporation/i.test(s) ? 2 : 0;
const monthIdx = d => (d.getUTCFullYear() - 2024) * 12 + d.getUTCMonth() - 3; // 2024-04 = 0

// history for filling blanks on new invoices
const teamOf = new Map(), stateOf = new Map();
for (const r of R.rows) {
  const sp = dv('sp', r[ix('sp')]), tm = dv('tm', r[ix('tm')]), cu = dv('cust', r[ix('cust')]), st = dv('st', r[ix('st')]), e = r[ix('e')];
  if (tm) { const k = e + '|' + sp, m = teamOf.get(k) || {}; m[tm] = (m[tm] || 0) + 1; teamOf.set(k, m); }
  if (st) { const m = stateOf.get(cu) || {}; m[st] = (m[st] || 0) + 1; stateOf.set(cu, m); }
}
const top = m => m ? Object.entries(m).sort((a, b) => b[1] - a[1])[0][0] : '';

function live(row, f) { // fields refreshed from the feed every run
  // Invoice date: a full date from the feed wins. If the feed carries only a month (or junk such as
  // "September-17"), an invoice already in the register keeps its date; a new one takes "Month Year".
  let d = toDate(f[C['Invoice/Bill Date']]);
  if (!d || d.monthOnly) {
    if (row[ix('date')]) d = null;
    else { d = d || toDate(f[C['Month Year']]); if (!d) die('no usable invoice date: ' + f[C['Number']]); }
  }
  if (d) {
    const m = monthIdx(d); if (m < 0 || m >= V.months.length) die('invoice outside FY24-27 months: ' + f[C['Number']]);
    row[ix('date')] = fmt(d); row[ix('m')] = m;
  }
  row[ix('loc')] = r2(num(f[C['Untaxed Amount Signed']]));
  row[ix('usd')] = r2(num(f[C['untaxed_amount_in_usd']]));
  row[ix('pay')] = di('pay', f[C['Status In Payment']] || 'Not Paid');
  const typ = f[C['untaxed_amount_status']] || (num(f[C['Untaxed Amount Signed']]) < 0 ? 'Credit Note' : 'Customer Invoice');
  row[ix('typ')] = di('typ', typ);
  const due = num(f[C['Amount Due']]); if (row[ix('due')] == null || Math.abs(due - row[ix('due')]) > 1) row[ix('due')] = r2(due);
  row[ix('dueDate')] = fmt(toDate(f[C['Due Date']]), row[ix('dueDate')] || '');
  row[ix('dso')] = Math.round(num(f[C['Days_outstanding']]));
  row[ix('ob')] = di('ob', f[C['aging_bucket']] || 'No Dues');
  row[ix('pdate')] = fmt(toDate(f[C['Payment_date']]), '');
  row[ix('pdel')] = Math.round(num(f[C['days']]));
  row[ix('db')] = di('db', f[C['aging_bucket_late']] || '');
  return row;
}
function fresh(f) { // a new invoice, every field from the feed
  const row = Array(F.length).fill(0);
  const e = ent(f[C['Company']]), cu = f[C['Invoice Partner Display Name']] || '', sp = f[C['Salesperson']] || '';
  row[ix('inv')] = f[C['Number']].trim(); row[ix('e')] = e;
  row[ix('cust')] = di('cust', cu); row[ix('sp')] = di('sp', sp);
  row[ix('st')] = di('st', f[C['Customer State']] || top(stateOf.get(cu)));
  row[ix('co')] = di('co', f[C['Customer Country']]); row[ix('cmp')] = di('cmp', f[C['Company']]);
  row[ix('rg')] = di('rg', f[C['Region']]); row[ix('cat')] = di('cat', f[C['Category']]);
  row[ix('tm')] = di('tm', f[C['Sales Team']] || top(teamOf.get(e + '|' + sp)));
  row[ix('so')] = f[C['so number']] || '';
  row[ix('sod')] = fmt(toDate(f[C['SO Order Date']]), '30 Dec 99');
  row[ix('pod')] = fmt(toDate(f[C['PO Receive Date']]), '30 Dec 99');
  row[ix('due')] = null; row[ix('date')] = '';
  return live(row, f);
}

const byId = new Map(R.rows.map(r => [r[0], r]));
let added = [], dropped = [], changed = 0;
const out = [];
for (const [id, f] of feed) {
  const old = byId.get(id);
  if (old && !ALL) { const before = JSON.stringify(old); live(old, f); if (JSON.stringify(old) !== before) changed++; out.push(old); }
  else { out.push(fresh(f)); if (!old) added.push(id); }
}
for (const id of byId.keys()) if (!feed.has(id)) dropped.push(id);
const key = r => { const [d, mo, y] = r[ix('date')].split(' '); return +y * 10000 + MON.indexOf(mo) * 100 + +d; };
out.sort((a, b) => key(b) - key(a) || (b[0] > a[0] ? 1 : b[0] < a[0] ? -1 : 0));
R.rows = out;

// ---------- validation: register ties to the feed, entity x FY ----------
const tot = {}, ftot = {};
for (const r of out) { const k = E[r[ix('e')]] + ' FY' + (24 + Math.floor(r[ix('m')] / 12)); tot[k] = (tot[k] || 0) + r[ix('loc')]; }
for (const [, f] of feed) { const k = E[ent(f[C['Company']])] + ' FY' + (+f[C['Fiscal_year']] - 2000); ftot[k] = (ftot[k] || 0) + num(f[C['Untaxed Amount Signed']]); }
for (const k of new Set([...Object.keys(tot), ...Object.keys(ftot)])) if (Math.abs((tot[k] || 0) - (ftot[k] || 0)) > 1) die(`${k}: register ${tot[k]} vs feed ${ftot[k]}`);

// ---------- dims ----------
const map = { customer: 'cust', salesperson: 'sp', state: 'st', country: 'co', company: 'cmp', region: 'rg', category: 'cat', team: 'tm' };
const M = V.months.length;
for (const [d, f] of Object.entries(map)) {
  const acc = new Map(), order = V.dims[d].map(x => x.e + '|' + x.v);
  for (const r of out) {
    let v = dv(f, r[ix(f)]); if (v == null || v === '') v = '(blank)';
    const k = E[r[ix('e')]] + '|' + v;
    if (!acc.has(k)) acc.set(k, { l: Array(M).fill(0), u: Array(M).fill(0), n: Array(M).fill(0) });
    const g = acc.get(k), m = r[ix('m')]; g.l[m] += r[ix('loc')]; g.u[m] += r[ix('usd')]; g.n[m]++;
  }
  const keys = [...order.filter(k => acc.has(k)), ...[...acc.keys()].filter(k => !order.includes(k))];
  V.dims[d] = keys.map(k => { const i = k.indexOf('|'), g = acc.get(k); return { e: k.slice(0, i), v: k.slice(i + 1), l: g.l.map(r2), u: g.u.map(r2), n: g.n }; });
}

// ---------- write + splice ----------
const newRR = rrTxt.slice(0, rrTxt.indexOf('"dict":')) + '"dict":' + JSON.stringify(R.dict) + ',\n"rows":[' + out.map(r => JSON.stringify(r).replace(/,/g, ', ')).join(', ') + ']};\n';
const newRD = 'window.REVENUE=' + JSON.stringify(V) + ';\n';
let html = fs.readFileSync(P('index.html'), 'utf8');
for (const [o, n] of [[rrTxt, newRR], [rdTxt, newRD]]) {
  const on = o.replace(/\r\n/g, '\n'); let src = html.includes(o) ? o : html.includes(on) ? on : null;
  if (!src || html.split(src).length !== 2) die('index.html does not contain the current data file verbatim');
  const i = html.indexOf(src); html = html.slice(0, i) + n + html.slice(i + src.length);
}
if (!html.includes('if (false && !window.__resources)')) die('index.html lost the live-hosting fix');
fs.writeFileSync(P('revenue-rows.js'), newRR); fs.writeFileSync(P('revenue-data.js'), newRD); fs.writeFileSync(P('index.html'), html);

const last = out[0][ix('date')];
console.log(`invoices ${out.length} (was ${base}) · new ${added.length} · dropped ${dropped.length} · refreshed ${changed} · latest ${last}`);
for (const k of Object.keys(tot).sort()) console.log(`  ${k}: ${tot[k].toFixed(2)}`);
if (added.length) console.log('  new: ' + added.slice(0, 30).join(', ') + (added.length > 30 ? ' …' : ''));
if (dropped.length) console.log('  dropped: ' + dropped.slice(0, 30).join(', '));
