# Data sources — IDCUBE MIS app

All P&L numbers trace to ONE Google Sheet. Nothing is live; say "update" and it gets re-pulled.

## P&L (India, Dubai, USA)
Sheet: **IDCUBE PL** — `16VBL2QCv461HFbOjeiKCsEhkSqA58Je5ZLI16p5xJ5Q`
Latest refresh from `uploads/profit_and_loss_India_Dubai_USA_Updated July 26.xlsx` (1 Sep 2026).
FY 24-25 and FY 25-26 come from the three per-entity tabs; **FY 26-27 comes from its own
`Profit & Loss FY 26-27` tab** (renamed from `FY 26-27`), which carries all three entities side by side in one grid
(India cols A–H, Dubai cols O–V, USA cols Z–AG; Apr–Jul 2026; category tag in each block's last column).
All three books now run Apr 2024 → **Jul 2026** (28 months) — Dubai and USA previously stopped at
Jun 2026, so consolidated Jul-2026 is no longer India-only (Dubai Jul revenue 2,647,242.82 AED,
USA 14,635.41 USD).
**The USA / Dubai subtotal discrepancy is resolved**: in the `FY 26-27` tab every entity's detail
lines tie to that tab's own Revenue / Gross Profit / Net Profit rows, so summing detail (which the
drill-downs show) and reading the subtotals now give the same answer.
Tabs: one per entity for FY 24-25 / 25-26. Layout: Code | Account Name | months | category tag (last column).
Category tags used: Hardware, Software, Services, Cost Of Materials Consumed,
Employee benefit expense, Other Expenses, Finance costs, Depreciation and Amortisation Expense,
Other Income, and `Income Tax Expense` (account name) → tax.
Every rebuild is validated against the tab's own Revenue / Less Costs of Revenue /
Less Operating Expenses / Net Profit rows, all 28 months.
Last pulled: 1 Sep 2026.
**FY 26-27 rebuilt 1 Sep 2026** from the `Profit & Loss FY 26-27` tab of
`uploads/profit_and_loss_India_Dubai_USA_Updated July 26.xlsx`. All three entities now tie to that
tab's own Net Profit row in every one of the four months (Apr–Jul 2026) — the previous pull had a
corrupted Jul-2026 column (an extractor bug on blank cells), which understated India employee
benefit and other expenses. Category tags in this tab: `Finane cost` (sic) → finance costs;
Dubai `PL210001 Bank Charges` → finance costs and `PL162001 Gain On Difference Of Exchange` →
other income (both untagged in the sheet).
FY 26-27 totals now loaded (functional currency, Apr–Jul 2026):
India rev 179,519,147 / EBE 69,920,625 / other 31,233,301 · Dubai rev 5,476,163 AED /
EBE 1,384,433 / other 175,796 · USA rev 74,749 USD / EBE 39,290 / other 12,997.

Reading note: `read_file_content` truncates on this workbook past ~2 tabs.
The reliable route is CSV export, which returns the FIRST tab only — so to refresh a
given entity, move its tab to first position, then export.

## Aug-26 refresh (21 Sep 2026)
Source: `uploads/profit_and_loss_India_Dubai_USA_Updated Aug 26.xlsx`.
· **P&L** now runs Apr-24 → **Aug-26 (29 months)**; FY 26-27 read from the `Profit & Loss FY 26-27`
  tab (India cols 3-7 / Dubai 17-21, col 22 is a total, not a month / USA 29-33; tags in cols 8/23/34).
  Ties to every tab's own Revenue and Net Profit row in all 29 months (India Nov-25 off ₹2, sheet rounding).
· **Revenue register** re-cut: **3,503 invoices** (3,559 rows less 56 in 32 partial-reversal pairs;
  75 full reversals kept). Apr-24 → Sep-26. Totals: India 981,525,996.82 · Dubai 43,917,152.77 AED ·
  USA 198,216.12. This cut is clean — no blank companies, no numeric junk in state/country/category,
  every invoice type present, so the earlier lookup workarounds no longer fire.
· **Intercompany** now comes from the workbook's own `Intercompany` tab (three FY blocks with
  different column layouts): **115 cross-book invoices** to Aug-26, $2,944,198.73. The Jun-26
  ₹15.0L Noida→Delhi support charge is still excluded (INR, intra-India).
· **Not updated — `Other exp & emp Beni FY26-27` still stops at Jul-26** (same 1,895 lines,
  identical totals), so the expense register has no Aug-26 lines.
· **New in the workbook, not yet in the app:** `Profit and Loss_PS 24-25 &26` — Purple Sphere LLP,
  expenses only, Apr-Aug 2026, INR (Aug-26 net loss 3,466,286). A fourth book is a structural change;
  awaiting the user's call.

## Sep-26 refresh (9 Oct 2026)
Source: `uploads/profit_and_loss_India_Dubai_USA_Updated Sep 26.xlsx`.
· **P&L** now runs Apr-24 → **Sep-26 (30 months)**, `PLN` = `[12,12,6]`. FY 26-27 tab layout moved: India months cols 2-7 / tag 8 · Dubai months 17-22 / tag 24 (no total column now) · USA months 30-35 / tag 36. Purple Sphere + Sapne from `Other Company` (Apr–Sep). All five books tie to their own Net Profit row in all six months, to the rupee. FY 24-25 / 25-26 unchanged (re-verified month by month).
  FY 26-27 Apr–Sep: India rev 264,883,890 · Dubai 7,559,953 AED · USA 75,352 USD. Purple Sphere salary/staff welfare/bonus → employee benefit (sheet tags them Other Expenses); its Sep `Purchase Expense` 35,000 → other expenses.
· **Expense register FY 26-27**: 2,811 lines, Apr→Sep-26 (was 1,895 to Jul), 333 vendors/partners. Ties to statement: India EBE 99.9% / other 97.6% · Dubai EBE 97.9% / other 87.7% · USA EBE 99.9% / other 89.1%.
· **Revenue register** — the tab now carries clean Payment Status and no duplicates, but it is a **different, partial cut**: 2,682 invoices Apr-24 → 8 Oct 26 (plus 1,076 FY 23-24 rows, not loaded). 824 invoices that were in the Aug-26 cut (all months, $4.65 M) are absent, and 638 are new. Where both cuts carry an invoice the amounts agree (2,044/2,044). Against P&L revenue the new cut alone covers India 63% / Dubai 70%; the union covers 80% / 89% and only exceeds the P&L in 3 book-months. **The app loads the union**: 3,506 invoices, the 824 carried over keep their Aug-26-cut payment status (list in `scraps/retained-invoices.json`). `RVN` = `[12,12,7]` (Oct-26 partial, to 8 Oct).
  Totals incl. tax: India 958,791,267 · Dubai 40,271,273 AED · USA 141,888.
  **Ask the sheet owner why those 824 invoices dropped out of the Revenue Summary extract** — if they were cancelled, they should be removed here.
· **Intercompany** Sep-26 added (12 Oct 2026): 3 India→Dubai invoices, $126,188 — INV/DL/2026/501 ($1,188),
  /523 ($50,000 bulk license), /599 ($75,000 software license). FY 26-27 block now matches the tab: **20 invoices, $466,956.50** — includes the Jun-26 Noida→Delhi ₹15.0L support charge (INV/UP/2026/037, $15,000 at ₹100), listed for completeness but not eliminated (it sits inside the India book).

## India Sep-26 purchase adjustment (12 Oct 2026)
· Workbook `…Updated Sep 26-e6114633.xlsx`: India FY 26-27 **Purchase Expense (PL170001), Sep-26** raised by ₹50,00,000 — ₹1,11,01,566.23 → ₹1,61,01,566.23 (cell H21, formula `11101566.23+5000000`). No other cell changed.
· The sheet's cached subtotals (H20 Cost of Revenue, H14 Gross Profit, H8 Net Profit) were not recalculated in the file; the app recomputes them, so India Sep Net Profit is now ₹50L lower than the stale H8 value (₹44,44,509.53 → ≈ −₹5,55,490).

## Revenue register rebuild (29 Sep 2026)
Source: `Revenue Summary` tab of `uploads/profit_and_loss_India_Dubai_USA_Updated Aug 26-7b13d00d.xlsx`.
· **691 invoices were on the tab twice** (FY 2024 block pasted a second time; the copy carries the company name in Payment Status). The app counted both. Now kept once — the copy with a real status. Register overstatement removed: India ₹18.8 Cr, Dubai 7.2 M AED, USA $82.8 K, almost all in FY 24-25.
· **Partial-reversal pairs are no longer dropped** — every invoice and credit note is kept and they net. Dropping both lines had removed the un-reversed value and left orphan receivables.
· **Payment Status** blank/garbled on 1,899 remaining rows; derived from the row itself (due>0 & no payment date → Not Paid; due>0 & paid date → Partially Paid; due≤0 & paid date → Paid; else Reversed). Rule reproduces 964/964 rows that carry a real status.
· Result: **2,868 invoices**, one per invoice number. Totals (incl. tax): India 793,401,089.96 · Dubai 36,727,244.29 AED · USA 115,443.58. `revenue-data.js` dims regenerated from the same rows.
· P&L re-tied the same day: India/Dubai/USA net profit match every month (India Nov-25 ₹2 rounding); Purple Sphere and Sapne match the `Other Company` tab (the older `Profit and Loss_PS` tab disagrees for Jul/Aug-26 and is not used).

## FX translation (set 21 Sep 2026)
Statement, registers and intercompany all use FY-fixed rates set by the CFO — no peg, the two
currencies are independent:
· USD → INR: FY 24-25 **85** · FY 25-26 **88** · FY 26-27 **100**
· AED → INR: FY 24-25 **22.5** · FY 25-26 **23** · FY 26-27 **24**
Intercompany invoices (all raised in USD) translate at the USD rate for their year.
Editable in the app's Tweaks panel (usdFy25/26/27, aedFy25/26/27).

## P&L extract fix (21 Sep 2026)
The earlier P&L extract read the three entity tabs positionally and **skipped empty cells**, so any
account row with blanks had its remaining months pulled left. Caught by the user: Dubai
`PL150001 Sales Account` 11,326 AED showed in Apr-24 when the sheet carries it in **Dec-24**.
`pl-data.js` has been rebuilt with a cell-reference parser and now ties, month by month, to each
tab's own **Revenue** and **Net Profit** rows for all 28 months and all three books (only residual:
India Nov-25 off ₹2, a rounding difference inside the sheet). Classification is taken from each
tab's category tag (India col 27, Dubai/USA col 28, FY 26-27 blocks cols 8/22/33), with the sheet
section used as a guard so an expense row can never land in an income bucket; income tax and
deferred tax sit in the tax line for all three books. Duplicate account names under different codes
are kept apart with the code in brackets.
Cross-checked and found **clean** (no rebuild needed): the 3,489-row revenue register, the FY 25-26
expense register (7,290 lines) and the FY 26-27 expense register (1,895 lines) all reconcile to
their tabs exactly.

## Intercompany
Sheet: **IDCUBE MIS** — `1ovmY28VvNiwQdfQJFozqHefdg1QZ5hX7cXfclCpTj6k`, IC tabs (FY 24-25, FY 25-26).
Column used: `Untaxed Amount Signed Currency` (USD). 52 invoices.
Converted at the USD rates above: 85 / 88 / 100.
Netted off consolidated revenue and off the buying entity's cost of materials.
Intra-India (Noida→Delhi) excluded.

## Revenue register
From the **`Revenue Summary`** tab of
`uploads/profit_and_loss_India_Dubai_USA_Updated July 26-cf6bf7f9.xlsx` (7 Sep 2026).
**3,489 invoices and credit notes, Apr-24 → Sep-26** (3,559 on the tab, less 70 partial-reversal rows),
five books (Delhi / Noida / Bengaluru → India, IDCUBE FZE → Dubai, IDCUBE Corporation → USA).
Supersedes the 2,480-row extract from the `-141fe509` file — the tab was re-cut with a fuller history,
so counts rise in every month, not just the new one. Revenue now runs one month longer: FY 26-27 carries
**six months (Apr–Sep 26)**, so `RVN` is `[12,12,6]`.
Amount used: **Total Untaxed Amount in Local Currency** (col R) — invoice value receivable from the
customer, i.e. Untaxed Amount in Local Currency (col F) **plus** Taxes in Local Currency (col Q) —
in each book's functional currency (India INR, Dubai AED, USA USD). Col T drives `amountUSD` in the
AI payload; the sheet's own USD columns drive no on-screen view.
Register totals, functional currency: India 962,105,687.26 INR · Dubai 41,127,536.05 AED · USA 142,571.51 USD.

**Reversals.** Every credit note's Reference reads `Reversal of: <invoice no>, <reason>`.
· full reversals (CN equals the original to the paisa) — **both lines kept**, they net to zero in the
  months they were raised: 98 rows;
· **partial reversals (CN smaller than the original) — both lines dropped**: 40 pairs, 70 rows,
  removing 50,552,015.48 net. This drops the un-reversed part of those invoices too.

**Unresolved lookup cells in this cut.** 315 rows arrived with a blank Company (col I) and a numeric
branch id in Sales Team Zone (col H). The id maps 1:1 to a book (327 Delhi · 344 Noida · 601 Bengaluru
· 10359 Dubai FZE) and is used to set the company; the sales team is then taken as that salesperson's
dominant team within that book. Separately 447 rows (mostly Dubai FZE, spread across all months) carry
a partner id in Customer State and a blank Customer Country, 1 row a numeric Partner Category, and 347
rows a blank Invoice Type. Numeric junk in state / country / region / category is stored as blank and
shows as `(blank)` in those lenses rather than being guessed — **this is intended, not a regression**:
the Country lens now lists 18 countries and State 49 states (was 34 / 43), because ~435 rows that
previously carried a resolved country arrived unresolved in this cut. Ask the sheet owner to refresh
cols C and D and the lenses fill back in on the next pull; Invoice Type is derived instead
(`Credit Note` when the reference is a reversal or the amount is negative, else `Customer Invoice`).


## Expense register (line level)
**FY 25-26** — Sheet: **IDCUBE other expense and Empl Benifit** — `1kw-1baC2kuHf8FHD0wIkkp2Xe9A7u427WV6MZWEIxlY`,
supplied as `uploads/Other expense and Empl benifit-55367060.xlsx` (31 Jul 2026), tab `25-26`.
**7,290 lines — every line on the tab** — Apr-25 → Mar-26, all five books: Delhi / Noida / Bengaluru (India), Dubai FZE, IDCUBE Corporation (USA).
Line counts and totals tie to the tab exactly: India 5,491 lines / 21,33,68,899 · Dubai 1,100 / 5,606,494 AED · USA 699 / 474,892 USD.
Columns used: Date, Financial Account (→ Expense Name, PL code stripped), New Cost center, Partner Name,
Company, **Amount (col O — functional currency)**, Type.
The workbook carries two Amount columns: col N is a flat INR conversion at 25/AED and 100/USD; col O is the
book's own functional currency. **Col O is what the app loads** — Dubai lines are AED, USA lines USD, India INR —
and the app translates with the same FY average rates as the statement, so the register and the statement agree.
Type `EBE` → Employee benefit, `Other Expense` → Other expenses.
**Signs flipped**: source books expenses negative, reversals positive → app shows expenses positive, reversals as credits.
4 lines carry a Mar-2025 date (provisions carried into FY 25-26 — 3 Noida, 1 Dubai FZE). They are **no longer dropped**: they sit in Apr-25 so the register ties to the tab's own totals.

Reconciliation to the statement, FY 25-26:
India EBE 97.5% · India other 100.9% · Dubai EBE 99.4% · Dubai other 102.5% · USA EBE 102.0% · USA other 113.7%.
The residual sits in `Other Expense`, whose ledger bucket is wider than Schedule III other expenses
(it carries income tax, FX loss, interest on TDS, loss on sale of assets, installation & repair) — noted in-app.
Compiled to `expense-data.js`.

**FY 26-27** — tab `Other exp & emp Beni FY26-27` of
`uploads/profit_and_loss_India_Dubai_USA_Updated July 26.xlsx` (1 Sep 2026).
**1,895 lines — every line on the tab** — Apr-26 → Jul-26, same five books.
Columns: Date, Description, Cost Center, Ref., Financial Account, Journal Item, Product, Partner,
Company, **Amount (col J — functional currency)**, clean account name (col K, used as the expense
head), Type (col L), Month (col M). Signs flipped the same way (expense positive, reversal negative).
Ties to the FY 26-27 statement: India other 31,233,300.48 over **1,221 lines** vs statement
31,233,300.86 (100.0%) · India EBE 69,920,624.99 over 299 lines (exact) · Dubai other 175,795.82 /
146 lines vs 175,796.12 · Dubai EBE 1,384,432.87 / 91 lines (exact) · USA EBE 39,231.35 / 52 lines
(99.9%) · USA other 12,100.16 / 86 lines vs 12,996.90 (93.1% — the residual is USA insurance and
bank charges sitting in the statement's other-expense line).
This tab's cost centres are the newer entity-suffixed vocabulary ("Sales Department Dubai",
"US Operation Department"), so FY 25-26 and FY 26-27 cost-centre names do not match one-to-one.
Compiled to `expense-data-2627.js` (`window.EXPDATA2627`, same row schema as FY 25-26).
The app picks the register by financial year; FY 24-25 still has none.

Reachable from Statement → Employee benefit / Other expenses → Expense register,
and from the Expenses tab.

## Resolved
Dubai `PL205014 Travelling Expense` was tagged Finance costs; retagged Other Expenses
in the Sheet on 30 Jul 2026 and moved in the app. Dubai finance costs are now bank charges only.


## Travel expense dashboard
Source project: `8cfea9a1-b038-426b-a9bc-714657b32466` (IDCUBE Travel Spend Analyser), file `data.js`.
Copied in as `travel-data.js` (`window.MMT_DATA`); `Travel Dashboard.dc.html` is a verbatim copy of the
source dashboard, differing only in that script filename.
Last pulled **4 Sep 2026** — coverage now Nov-2024 → **Sep-2026** (previously Jul-2026).
To refresh: re-copy `data.js` from that project over `travel-data.js`, and re-copy the dashboard file if
its logic changed (rewrite the two `data.js` references to `travel-data.js`).

## Universal search
Header magnifier on every tab. Indexes, from the data already loaded: the six screens, statement
lines, every ledger account (with the entities it appears in), all revenue dimension members
(customers, salespeople, states, countries, companies, regions, categories, sales zones),
expense heads / cost centres / partners / books, entities, financial years and individual months.
Each hit navigates straight to the drill-down that holds it, setting tab, dimension, period and
expense-kind as needed. Built lazily on first open and cached.
