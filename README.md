# Money Backers

*We've got your money's back.*

Money Backers reads your receipts (pasted text, PDFs, or photos), pulls out the store, date and total, works out return deadlines, flags subscriptions with their yearly cost, and totals up the money you could recover. Includes a waitlist landing page with referral links.

## Run locally

```bash
npm install
node server.js
```

Then open http://localhost:5173 (or the port printed on startup). Run tests with `node test.js`.

With no `DATABASE_URL`, waitlist signups are stored in `data/waitlist.json` (gitignored). Set `DATABASE_URL` to store them in Postgres instead.

## Deploy on Render

Render's free plan wipes local files on restart or sleep, so `data/waitlist.json` would lose signups. When `DATABASE_URL` is set, join, unsubscribe, lookups, and referral counts use Postgres. The server creates the `waitlist` table on startup. You do not run any SQL yourself.

1. Create a free Neon project. Go to [https://console.neon.tech](https://console.neon.tech), sign up, and click **New Project**. The free plan is enough. Pick a region close to your Render service.
2. Copy the connection string. In the Neon project, click **Connect**, choose **Node.js**, and copy the full string. It looks like `postgresql://USER:PASSWORD@HOST/dbname?sslmode=require&channel_binding=require`. Keep it secret and do not commit it.
3. Create a **Web Service** on Render from this repo, if you do not already have one:
   - Build command: `npm install`
   - Start command: `node server.js`
4. Add `DATABASE_URL` in Render. Open the service, go to **Environment**, and add an environment variable with key `DATABASE_URL` and the Neon connection string as the value. Save. Render redeploys.

On startup the app connects with that variable and creates the table if it is missing. Receipts in the demo still stay in the visitor's browser. Only the waitlist is stored in Postgres.
