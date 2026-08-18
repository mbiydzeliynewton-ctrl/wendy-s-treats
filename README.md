# Wendy's Treats

A storefront (`index.html`) and a separate admin dashboard (`admin.html`), both
plain HTML/CSS/JS — no build step, no framework. The backend is Supabase:
Postgres for data, Supabase Auth for the admin login, and Supabase Storage for
product photos.

```
   VERCEL (static hosting)
   index.html · admin.html
              │
              │ @supabase/supabase-js (loaded from a CDN <script> tag)
              ▼
        SUPABASE
   Postgres · Auth · Storage · Row Level Security
              ▲
              │
           GITHUB (source + version control)
```

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**.
2. Pick a name, a database password (save it somewhere — you likely won't
   need it day-to-day, but it's your last resort if you're ever locked out),
   and a region close to your customers.
3. Wait for it to finish provisioning (a minute or two).

## 2. Run the database schema

1. In your Supabase project, open **SQL Editor** (left sidebar) → **New query**.
2. Open `supabase_schema.sql` from this folder, copy the whole file, paste it
   into the editor.
3. Click **Run**.
4. You should see it finish with no errors, and a `categories` table with 3
   rows already in it (Cakes, Savory, Drinks) — check **Table Editor** in the
   sidebar to confirm.

This one script creates every table, the indexes, the `updated_at` triggers,
every Row Level Security policy, the `product-images` Storage bucket, and its
storage policies. You only need to run it once.

## 3. Create your admin login

This project has no public sign-up — you create your own one admin account by
hand, directly in the dashboard:

1. **Authentication** (left sidebar) → **Users** → **Add user** → **Create
   new user**.
2. Enter your email and a password.
3. Look for an option like **Auto Confirm User** and make sure it's turned
   on, so the account is active immediately without needing to click a
   confirmation link. (Supabase's exact wording here shifts between
   versions — if you don't see that option, create the user, then check
   whether it needs confirming before it'll let you log in.)
4. That email + password is what you'll type into `admin.html`'s login form.

If you ever want a second staff login later, repeat this step — anyone with
a confirmed account in this project can manage the site, since there's no
public registration flow, "logged in" and "admin" are the same thing here.

## 4. Get your API keys

1. **Project Settings** (gear icon) → **API**.
2. Copy the **Project URL**.
3. Copy the **anon / public** key. (Not the `service_role` key — never use
   that one in these files. See `.env.example` for why.)

## 5. Connect the frontend

Open both `index.html` and `admin.html`. Near the top of the `<script>` in
each, you'll find:

```js
var SUPABASE_URL = 'YOUR_SUPABASE_URL';
var SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace both placeholder strings in **both files** with the values from step
4.

## 6. Try it locally

Because the admin login needs a real `https://` origin to work smoothly
(not a `file://` one), serve the folder with any simple static server rather
than double-clicking the HTML files. Two zero-install options:

```bash
# Option A — if you have Node:
npx serve .

# Option B — if you have Python:
python3 -m http.server 5500
```

Then open the address it gives you (e.g. `http://localhost:5500`), and
`http://localhost:5500/admin.html` for the dashboard.

---

## 7. Push to GitHub

```bash
git init
git add .
git commit -m "Initial full-stack implementation"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL of an empty repository you
create on GitHub first (**New repository** → don't initialize it with a
README, since you already have one). `.gitignore` already keeps OS/editor
clutter out; there's no `.env` file to accidentally commit since the keys
live directly in the two HTML files (see `.env.example` for why that's safe).

## 8. Deploy to Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import the
   GitHub repository you just pushed.
2. Framework preset: **Other** (this is a static site — no build command,
   no output directory needed).
3. No environment variables to add — the keys already live in the committed
   HTML files.
4. **Deploy**.
5. Every future `git push` to `main` triggers a new deployment automatically.
   To redeploy without a code change, use **Redeploy** from the Vercel
   dashboard's deployments list.

---

## What changed, and why

**Database.** `categories`, `products`, `orders` + `order_items`, `bookings`,
`trainees`, `posts`, `faqs`, `services`, `site_settings` — one table per real
content type your site has. `faqs`/`services` are fully admin-manageable
(add/edit/delete); `site_settings` covers everything else editable —
contact info, socials, the WhatsApp number, and the About page text. Full
column-by-column reasoning is in the comments inside `supabase_schema.sql`.

**Authentication.** The old admin login checked a password hash entirely in
the browser (visible in page source, bypassable from devtools). It's now
real Supabase Auth — `signInWithPassword`, `signOut`, and a session-driven
`onAuthStateChange` listener that shows/hides the dashboard.

**Authorization.** Row Level Security, not frontend checks, is what actually
protects your data. The public (anonymous) role can read active
products/posts and *submit* orders, bookings, and trainee applications —
never read, edit, or delete them. Only a signed-in admin can do everything
else. See the policies at the bottom of `supabase_schema.sql`.

**Storage.** Product photos now upload to a real `product-images` bucket
instead of being compressed into base64 and stored inside a database column.
Replacing or deleting a product's photo now also deletes the old file from
Storage.

**Frontend.** Both files kept their design, layout, and CSS untouched. The
changes were: swapping the local API calls (`fetch('http://localhost:4000/api/...')`)
for direct Supabase client calls; adding one "Feature on homepage" checkbox
to the product form (replacing 3 hardcoded product IDs, so featured items
are actually admin-editable); and moving the homepage promo banners
("posts") from browser-only `localStorage` to the real `posts` table, since
that was the one piece with no backend at all before.

**Env vars.** No build tool exists in this project, so there's no
`import.meta.env` or `process.env` available in the browser at runtime.
`.env.example` documents the two values for reference; the actual values
live directly in the JS config (step 5). This is standard practice for a
Supabase anon key specifically — it's designed to be public.

---

## Testing checklist

**Public site**
- [ ] Site loads, products and categories appear (pulled from Supabase)
- [ ] Favorites section shows only products with "Feature on homepage" checked
- [ ] Adding to cart and checking out opens WhatsApp with the order pre-filled
- [ ] Booking form and trainee application both open WhatsApp and save to Supabase
- [ ] Homepage banner and notification bell reflect a post you added in admin
- [ ] With Supabase briefly unreachable (e.g. wrong URL), sections render empty instead of erroring

**Admin**
- [ ] Login works with your real Supabase account; wrong password fails cleanly
- [ ] Logging out returns you to the login screen
- [ ] Opening `admin.html` in a private/incognito window (no session) shows the login screen, not the dashboard
- [ ] Add / edit / delete a product, including photo upload and photo replacement
- [ ] Confirm an order, confirm a booking, approve a trainee application
- [ ] Add and delete a post, and see it appear/disappear on the public site
- [ ] Add / edit / delete a FAQ, and see it reflected on the FAQ page
- [ ] Add / edit / delete a service, and see it reflected on the Services page
- [ ] Change a Settings field (e.g. address) and confirm it updates on the public site
- [ ] Change password, then log in with the new one

**Security**
- [ ] In a browser dev console on the *public* site, running
      `supabaseClient.from('products').delete().neq('id', 0)` fails (RLS blocks it)
- [ ] View page source on both files — no `service_role` key anywhere
- [ ] The old `localhost:4000` API is no longer referenced anywhere

**Deployment**
- [ ] GitHub repository has all files, no `.env` committed
- [ ] Vercel deployment succeeds and the live URL works end-to-end
- [ ] A fresh `git push` triggers a new Vercel deployment automatically
