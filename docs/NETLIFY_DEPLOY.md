# Deploy Frontend to Netlify (GitHub linked)

Your repo is already linked to Netlify. Follow these steps so the **frontend** (Next.js) deploys correctly.

---

## 1. Site settings in Netlify

In **Netlify Dashboard** → your site → **Site configuration** → **Build & deploy** → **Build settings**:

| Setting | Value |
|--------|--------|
| **Base directory** | `frontend` |
| **Build command** | `npm run build` |
| **Publish directory** | *(leave empty – the Next.js plugin sets it)* |

If you use **Option A** below, Netlify can detect Next.js and set these for you. The repo’s `netlify.toml` also sets `base` and `command`, so they may already be correct.

---

## 2. Environment variables

In **Site configuration** → **Environment variables** → **Add a variable** (or **Import from .env`**), add:

| Variable | Value | Scopes |
|----------|--------|--------|
| `NEXT_PUBLIC_API_URL` | `https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api` | All (Production, Preview, Development) |

Optional (if you use them):

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` – push notifications
- `REVALIDATE_SECRET` – if you use on-demand revalidation
- Cloudinary (only if you override defaults): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

Save. Then trigger a new deploy (see step 4).

---

## 3. Two ways to set the build

### Option A: Let Netlify detect (simplest)

1. Netlify Dashboard → your site → **Site configuration** → **Build & deploy** → **Build settings** → **Edit settings**.
2. Set **Base directory** to `frontend`.
3. Leave **Build command** and **Publish directory** blank so Netlify (and the Next.js plugin) can set them.
4. Save.

### Option B: Use the repo’s `netlify.toml` (already in the repo)

The repo root contains a `netlify.toml` that sets:

- `base = "frontend"`
- `command = "npm run build"`
- `[[plugins]] package = "@netlify/plugin-nextjs"`

If Netlify is building from the repo root, it will use this. Ensure **Build command** in the UI is either empty (so Netlify uses the file) or matches: `npm run build`. **Base directory** in the UI should be `frontend` (or leave empty if the config file is picked up and you’ve pushed `netlify.toml`).

---

## 4. Deploy

- **Automatic:** Push to the branch connected to Netlify (e.g. `master`/`main`). Netlify will build and deploy.
- **Manual:** **Deploys** → **Trigger deploy** → **Deploy site**.

---

## 5. Check the deploy

- **Deploys** tab: confirm the build completes and “Published” is green.
- Open your site URL; the app should load and talk to the Heroku API (`NEXT_PUBLIC_API_URL`).

If the build fails, open the **build log** and look for errors in `npm install` or `npm run build` (often Node version or missing env vars).

---

## Quick checklist

- [ ] Netlify site is linked to the correct GitHub repo and branch.
- [ ] **Base directory** = `frontend`.
- [ ] **Build command** = `npm run build` (or empty if using `netlify.toml`).
- [ ] **Environment variable** `NEXT_PUBLIC_API_URL` = `https://loudbrands-backend-eu-abfa65dd1df6.herokuapp.com/api`.
- [ ] Deploy triggered and build succeeded.
