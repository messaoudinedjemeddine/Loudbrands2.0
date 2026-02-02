# 500 on POST /api/inventory/receptions – Where is the problem?

Your app: **loudbrands-backend-eu** → URL: **https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com**

The frontend URL is correct. The 500 comes from **that** backend. Use the steps below to find the exact cause.

---

## 1. See the real error (Response body)

1. In the browser: **DevTools** (F12) → **Network**.
2. Trigger **Create reception** again (Stock In → select atelier → Valider).
3. Click the red request **`receptions`** (POST).
4. Open the **Response** (or **Preview**) tab.

You should see JSON like: `{ "error": "..." }`.  
That message is the real error from the backend. It may be:

- **"Atelier not found..."** → You need to create an atelier in Admin → Ateliers first.
- **"Base de données non à jour..."** → Migrations not applied on this app’s DB (see step 2).
- **Prisma / raw error** → Code/schema mismatch (see steps 2 and 3).

---

## 2. Confirm migrations on this app’s database

Migrations must be run **on the same app** whose URL you use (`loudbrands-backend-eu`).

From your machine (Heroku CLI, same app name):

```bash
heroku run "cd backend && npx prisma migrate deploy" --app loudbrands-backend-eu
```

- If it says **"No pending migrations"** or lists applied migrations → DB is up to date.
- If it **errors** (e.g. "table already exists", "column does not exist") → that error is the cause; fix the DB or the migration.
- If you never ran this after adding the Atelier/StockReception changes → run it once, then try again.

---

## 3. Confirm the **deployed** code and build

The 500 can be from **old code** or **old Prisma client** on the dyno.

- **How do you deploy?** (GitHub deploy, `git push heroku`, CI, etc.)
- After adding the Atelier model and `atelierId` in receptions, did you **redeploy** this app so the new code and `prisma generate` run again?

Check:

1. **Last deploy time**  
   Heroku Dashboard → **loudbrands-backend-eu** → **Activity** (or **Deploys**).  
   It should be **after** you added the atelier/reception changes.

2. **Build command**  
   If the project is a **monorepo** (root = repo root), the build must:
   - Install dependencies for the backend (e.g. `cd backend && npm install`).
   - Run **`npx prisma generate`** (e.g. in `backend/package.json` **postinstall** or in the build).

   If `prisma generate` is not run with the **new** schema (with Atelier, atelierId, etc.), the running app still has an old Prisma client and can throw when calling `prisma.atelier.findUnique()` or creating a reception with `atelierId`.

So: **redeploy** after your last schema/code change and ensure the build runs `prisma generate` from the backend folder with the current schema.

---

## 4. Quick checklist

| Check | What to do |
|-------|------------|
| **Response body** | DevTools → Network → POST `receptions` → Response. Copy the `error` message. |
| **Atelier exists** | In the app: Admin → Ateliers → create at least one atelier; use it when creating a reception. |
| **Migrations** | Run `heroku run "cd backend && npx prisma migrate deploy" --app loudbrands-backend-eu`. |
| **Redeploy** | Deploy the latest code (with Atelier + atelierId) so the new Prisma client is built and used. |

Once you have the **exact `error` string** from the response body, you can match it to one of these and fix that part (DB, atelier, or deploy/build).
