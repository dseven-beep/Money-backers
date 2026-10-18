# Money Backers

*We've got your money's back.*

Money Backers reads your receipts (pasted text, PDFs, or photos), pulls out the store, date and total, works out return deadlines, flags subscriptions with their yearly cost, and totals up the money you could recover. Includes a waitlist landing page with referral links.

## Run locally

```bash
npm install
node server.js
```

Then open http://localhost:5173 (or the port printed on startup). Run tests with `node test.js`.

## Deploy on Render

Create a new **Web Service** from this repo:

- Build command: `npm install`
- Start command: `node server.js`

Waitlist and user data are stored under `data/`, which is not committed.
