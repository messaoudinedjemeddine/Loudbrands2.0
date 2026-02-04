# CI/CD Setup – Monorepo (Vercel + Heroku)

This doc describes the automated CI/CD setup for the monorepo: frontend on Vercel, backend on Heroku, with safe Prisma migrations.

---

## 1. Vercel – Ignored Build Step (frontend only when needed)

Vercel is linked to the GitHub repo. To avoid building the frontend when **only** the backend changed:

1. In **Vercel** → your project → **Settings** → **Git**.
2. Find **Ignored Build Step**.
3. Paste this command:

```bash
git diff --name-only HEAD^ HEAD 2>/dev/null | grep -qv '^backend/' | grep -q . && exit 1 || exit 0
```

**Behavior:**

- **Exit 0** → Vercel **skips** the build (no frontend deploy).
- **Exit 1** → Vercel **runs** the build and deploys the frontend.

So the build is **skipped** only when every changed file is under `backend/`. Any change under `frontend/` or at the repo root will trigger a build.

---

## 2. Backend – GitHub Action (Heroku deploy)

Workflow file: **`.github/workflows/deploy-backend.yml`**.

- **Trigger:** Push to `main` when at least one file under `backend/**` changed.
- **Steps:**
  1. Checkout repo (full history for `git subtree split`).
  2. Create a branch where only `backend/` is at the repo root (`git subtree split --prefix=backend`).
  3. Push that branch to Heroku’s `main`. Heroku runs the app from that root (your backend).

Heroku’s native GitHub integration doesn’t handle subdirectories well; this workflow deploys only the backend subdirectory.

---

## 3. Database migrations – Heroku release phase

Migrations run automatically on every backend deploy so the app never starts with missing columns/tables.

**Backend Procfile** (`backend/Procfile`):

```procfile
release: npx prisma migrate deploy
web: node src/server.js
```

- **`release:`** Heroku runs this **once** after the new slug is built and **before** switching traffic to the new dynos. If it fails, the release is aborted and the old version stays live.
- **`web:`** Your app process.

So `npx prisma migrate deploy` runs before the new version goes live, and a failed migration does not take down the site.

---

## 4. GitHub secrets required

Add these in **GitHub** → your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret name         | Description |
|---------------------|-------------|
| **`HEROKU_API_KEY`** | Heroku API key. Get it: [Dashboard](https://dashboard.heroku.com/account) → **API Key** → Reveal & copy. |
| **`HEROKU_APP_NAME`** | Exact Heroku app name (e.g. `my-app-name`). Shown in the Heroku dashboard URL and in **Settings** → **App name**. |

You do **not** need `HEROKU_EMAIL` for this setup; the workflow uses `HEROKU_API_KEY` for Git push authentication.

---

## Quick checklist

- [ ] Vercel: **Ignored Build Step** set to the command above.
- [ ] GitHub: **`HEROKU_API_KEY`** and **`HEROKU_APP_NAME`** added as repository secrets.
- [ ] Backend: **`backend/Procfile`** contains the `release: npx prisma migrate deploy` line.
- [ ] Backend: **`DATABASE_URL`** (and any other env) set in Heroku **Settings** → **Config vars** so migrations and the app can connect to the DB.

After that, pushing to `main` will:

- Deploy the frontend on Vercel only when there are non-backend changes.
- Deploy the backend to Heroku only when there are `backend/**` changes, with migrations run automatically in the release phase.
