# 5-Minute Multifamily Analyzer (PWA)

A phone-friendly, offline-capable quick-screen tool for underwriting multifamily deals in ~5 minutes, aligned with the Lindahl contrarian / emerging-markets playbook.

## What it does
- Inputs: units, avg rent, other income, occupancy, expense ratio or $/door/yr, price, acq costs, initial CapEx, LTV, rate, amort, IO years.
- Outputs: GPR, EGI, Opex, NOI, Cap Rate, Loan Amt, Annual Debt Service, DSCR, Cash-on-Cash, Break-even Occupancy, Cash In.
- Targets: Cap, CoC, DSCR badges (pass/fail).
- Price guidance: Max Price to hit DSCR target; Price at target Cap.
- Extras: Save locally, share prefilled links, works offline (PWA).

## How to host on GitHub Pages
1. Create a new GitHub repo (public): **five-min-multifamily-analyzer** (or any name).
2. Upload these files to the repo root: `index.html`, `style.css`, `app.js`, `manifest.json`, `sw.js`.
3. In the repo: **Settings → Pages → Build and deployment**. Set **Source = Deploy from a branch**. Branch = `main`, Folder = `/ (root)` → Save.
4. Wait for it to publish. Your app will be at: `https://<your-username>.github.io/<repo-name>/`.
5. On your phone, open the URL and **Add to Home Screen** to install.

## Notes
- DSCR uses full P&I; IO years inform cash flow thinking but lenders underwrite to amortizing debt.
- NOI excludes CapEx and debt service.
- Expense mode toggle lets you switch between ratio-of-EGI and $/door/year.
- Quick-screen only. For any live deal, request T12 (month-by-month) and rent roll, verify income with bank statements, and walk every unit.
