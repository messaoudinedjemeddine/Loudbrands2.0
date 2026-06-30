# Run Prisma migrations directly on Heroku

Use these commands from your machine (with [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed and logged in).

## Find your backend app name

If you get **"Couldn't find that app"**, the app name may be wrong or the app is in another Heroku account. List apps you have access to:

```bash
heroku apps
```

Use the **exact name** of your backend app (the one that hosts the Node/Prisma API). In the commands below, replace `YOUR_APP_NAME` with that name.

## 1. Run Prisma migrations

If your Heroku app is the **full monorepo** (repo root = app root), run from the backend folder so the project’s Prisma version is used:

```bash
heroku run "cd backend && npx prisma migrate deploy" --app YOUR_APP_NAME
```

If your app is **backend-only** (e.g. deployed via subtree), use:

```bash
heroku run npx prisma migrate deploy --app YOUR_APP_NAME
```

This applies all pending migrations to the Heroku Postgres database.

## 2. (Optional) Run legacy data script (Atelier + cost backfill)

After the Atelier/StockReception migration is applied, run once to backfill ateliers and costs from old data:

```bash
heroku run "cd backend && node scripts/migrate-atelier-and-costs.js" --app YOUR_APP_NAME
```

---

**Note:** If the CLI asks you to log in, run `heroku login` first. If the app was created by a teammate, make sure you’re in the same Heroku team or have been added as a collaborator.
