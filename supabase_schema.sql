-- ============================================================
-- Wendy's Treats — Supabase schema
-- ============================================================
-- HOW TO RUN THIS:
--   Supabase Dashboard → your project → SQL Editor → New query
--   → paste this whole file → Run.
-- Safe to run more than once — it clears out anything a previous
-- attempt already created before rebuilding everything. Only do
-- that once you have real orders/products in there you care about
-- (at that point, ask me for a migration instead of re-running this).
-- ============================================================

-- ============================================================
-- RESET — drops anything a previous run of this exact file left
-- behind, so "relation already exists" can't happen on a re-run.
-- ============================================================
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists bookings cascade;
drop table if exists trainees cascade;
drop table if exists posts cascade;
drop table if exists products cascade;
drop table if exists categories cascade;
drop table if exists faqs cascade;
drop table if exists services cascade;
drop table if exists site_settings cascade;
delete from storage.objects where bucket_id = 'product-images';
delete from storage.buckets where id = 'product-images';
drop policy if exists "public read product images" on storage.objects;
drop policy if exists "admin upload product images" on storage.objects;
drop policy if exists "admin update product images" on storage.objects;
drop policy if exists "admin delete product images" on storage.objects;

create extension if not exists "pgcrypto"; -- gives us gen_random_uuid()

-- ============================================================
-- CATEGORIES
-- Primary key is a readable slug, not a UUID, on purpose: the
-- storefront already routes by category id in the URL hash
-- (#/category/cakes) and the admin's product-category dropdown
-- uses the same id. Keeping it a slug means zero routing changes.
-- No admin CRUD UI exists for categories today, so this is meant
-- to be edited directly in the Supabase Table Editor if you ever
-- add/rename a category.
-- ============================================================
create table categories (
  id          text primary key,            -- e.g. 'cakes', 'savory', 'drinks'
  name        text not null,
  emoji       text not null default '🍽️',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table products (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique,                 -- reserved for future SEO-friendly links; not required
  category_id  text references categories(id) on delete set null,
  name         text not null,
  description  text not null,
  price        numeric(10,2),               -- null when only a price_label applies
  price_label  text not null,               -- e.g. "From 15,000 FCFA" — always shown
  image_url    text,                        -- Supabase Storage public URL, or an admin-pasted URL
  emoji        text not null default '🍽️',  -- fallback visual when there's no image
  badge        text,                        -- optional small ribbon, e.g. "New"
  badge_style  text default 'folere',
  item_type    text not null default 'cart' check (item_type in ('cart','booking')),
  is_featured  boolean not null default false, -- powers the Favorites section (replaces hardcoded FAVORITE_IDS)
  is_active    boolean not null default true,  -- lets admin hide a product without deleting it
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index products_category_id_idx on products(category_id);
create index products_is_featured_idx on products(is_featured) where is_featured = true;

-- ============================================================
-- ORDERS (cart checkout → WhatsApp)
-- No customer name/phone today — checkout only ever sent
-- {items, subtotal}. Add columns here later if that changes.
-- ============================================================
create table orders (
  id          uuid primary key default gen_random_uuid(),
  subtotal    numeric(10,2) not null,
  status      text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id) on delete set null, -- kept even if the product is later deleted
  product_name text not null,   -- snapshot at order time — survives edits/deletes to the product
  quantity     integer not null check (quantity > 0),
  line_label   text not null,   -- snapshot of the formatted price line shown in the WhatsApp message
  created_at   timestamptz not null default now()
);
create index order_items_order_id_idx on order_items(order_id);

-- ============================================================
-- BOOKINGS (the booking form → WhatsApp)
-- ============================================================
create table bookings (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  phone            text not null,
  order_type       text not null,   -- "Birthday Cake Order" / "Bulk / Event Order" / "Retail Order" / "Other"
  category_name    text,            -- free text — the form sends the category NAME, not its id
  needed_on        date,
  delivery_method  text not null check (delivery_method in ('Delivery','Pickup')),
  address          text,
  notes            text,
  status           text not null default 'pending' check (status in ('pending','confirmed','cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ============================================================
-- TRAINEES ("Apply to Train" applications)
-- ============================================================
create table trainees (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  reason      text not null,
  status      text not null default 'pending' check (status in ('pending','approved','declined')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- POSTS (homepage promo banners)
-- Currently localStorage-only, so this is the one content type
-- that's genuinely new, not a migration of an existing API call.
-- The storefront's notification bell will read from this same
-- table (recent/active posts) instead of a separate synced feed —
-- per-visitor "seen it" state stays client-side, since that's a
-- local UI preference, not data that needs to persist anywhere.
-- ============================================================
create table posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  message     text not null,
  badge       text not null default 'NEW',
  emoji       text not null default '🎉',
  cta_target  text not null default 'all',      -- a category id, or 'all'
  cta_text    text not null default 'Order Now',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index posts_is_active_idx on posts(is_active) where is_active = true;

-- ============================================================
-- ============================================================
-- FAQS — the FAQ page, fully admin-manageable (add/edit/delete)
-- ============================================================
create table faqs (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answer      text not null,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ============================================================
-- SERVICES — the "Why Wendy's Treats" cards, admin-manageable.
-- `icon` is one of a small curated set the admin picks from in
-- the dashboard (truck, grid, home, graduation, clock, calendar,
-- check, mail) rather than a free-form upload.
-- ============================================================
create table services (
  id           uuid primary key default gen_random_uuid(),
  icon         text not null default 'check',
  title        text not null,
  description  text not null,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- SITE_SETTINGS — single-value site-wide text: contact details,
-- socials, the WhatsApp number, and the About page story. A fixed
-- set of rows (admin edits values; there's nothing meaningful to
-- "add" here since the frontend only ever looks up known keys).
-- ============================================================
create table site_settings (
  key         text primary key,
  value       text not null default '',
  updated_at  timestamptz not null default now()
);

-- updated_at, kept in sync automatically
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();
create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger bookings_set_updated_at before update on bookings
  for each row execute function set_updated_at();
create trigger trainees_set_updated_at before update on trainees
  for each row execute function set_updated_at();
create trigger faqs_set_updated_at before update on faqs
  for each row execute function set_updated_at();
create trigger services_set_updated_at before update on services
  for each row execute function set_updated_at();
create trigger site_settings_set_updated_at before update on site_settings
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Rule of thumb used throughout: the public (anonymous) role can
-- READ active catalog/promo content and can INSERT the four
-- "someone just submitted this" tables — never read, update, or
-- delete them. Only a signed-in admin can do everything else.
-- Since this project has no public sign-up, "authenticated" and
-- "the admin" are effectively the same thing — there's no flow
-- that lets anyone but you create a Supabase Auth account.
-- ============================================================
alter table categories    enable row level security;
alter table products      enable row level security;
alter table orders        enable row level security;
alter table order_items   enable row level security;
alter table bookings      enable row level security;
alter table trainees      enable row level security;
alter table posts         enable row level security;
alter table faqs          enable row level security;
alter table services      enable row level security;
alter table site_settings enable row level security;

-- Public read access
create policy "public read categories"      on categories    for select using (true);
create policy "public read active products" on products      for select using (is_active = true);
create policy "public read active posts"    on posts         for select using (is_active = true);
create policy "public read faqs"            on faqs          for select using (true);
create policy "public read services"        on services      for select using (true);
create policy "public read site_settings"   on site_settings for select using (true);

-- Public can submit — never read/update/delete
create policy "public insert orders"      on orders      for insert with check (true);
create policy "public insert order_items" on order_items for insert with check (true);
create policy "public insert bookings"    on bookings    for insert with check (true);
create policy "public insert trainees"    on trainees    for insert with check (true);

-- Admin (any authenticated user) — full access everywhere
create policy "admin full access categories"    on categories    for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access products"      on products      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access orders"        on orders        for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access order_items"   on order_items   for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access bookings"      on bookings      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access trainees"      on trainees      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access posts"         on posts         for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access faqs"          on faqs          for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access services"      on services      for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin full access site_settings" on site_settings for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA — categories (rename/reorder/add as you like; this
-- is the one table you'll likely edit by hand in the Table Editor)
-- ============================================================
insert into categories (id, name, emoji, sort_order) values
  ('cakes',  'Cakes',  '🎂', 1),
  ('savory', 'Savory', '🥧', 2),
  ('drinks', 'Drinks', '🍹', 3);

-- ============================================================
-- SEED DATA — faqs, services, site_settings (the site's current
-- real content, so nothing goes blank when this replaces what
-- was hardcoded)
-- ============================================================
insert into faqs (question, answer, sort_order) values
  ('Do you deliver?', 'Yes! We offer delivery depending on your location. Delivery fees may apply — just share your address when booking.', 1),
  ('How far in advance should I order a birthday cake?', 'We recommend booking at least 3–5 days ahead for standard cakes, and 1–2 weeks for large or intricate designs.', 2),
  ('Do you take bulk or event orders?', 'Absolutely — we cater bulk and retail orders for parties, weddings, and corporate events. Reach out via the booking form or WhatsApp.', 3),
  ('Can I learn to bake with Wendy''s Treats?', 'Yes! We welcome trainees who want to learn hands-on baking and pastry skills. Head to the Booking page and tap "Apply to Train" to send us your details.', 4),
  ('How do I pay for my order?', 'Once your order is confirmed over WhatsApp, we''ll share payment details (Mobile Money or bank transfer) to complete it.', 5);

insert into services (icon, title, description, sort_order) values
  ('truck', 'Fast Delivery', 'We deliver your treats fresh, right to your doorstep.', 1),
  ('grid', 'Bulk & Retail', 'From a single cupcake to a full event order — we''ve got you covered.', 2),
  ('home', 'Homemade Goodness', 'Every treat is lovingly made fresh from our home kitchen.', 3),
  ('graduation', 'Open to Trainees', 'Want to learn baking & pastry skills hands-on? We welcome trainees.', 4);

insert into site_settings (key, value) values
  ('whatsapp_number', '237682389897'),
  ('email', 'hello@wendystreats.com'),
  ('social_instagram', 'https://www.instagram.com/wendystreats237'),
  ('social_facebook', 'https://facebook.com/wendystreats'),
  ('social_tiktok', 'https://tiktok.com/@wendystreats'),
  ('social_youtube', 'https://youtube.com/@wendystreats'),
  ('social_x', 'https://x.com/wendystreats'),
  ('social_linkedin', 'https://linkedin.com/company/wendystreats'),
  ('contact_address', 'Buea, Cameroon'),
  ('contact_hours', 'Mon–Sat 8AM–7PM
Sun by appointment'),
  ('about_paragraph_1', 'Wendy''s Treats began with a simple love for baking and bringing people together over good food. Today, we create custom birthday cakes, cake loaves, cupcakes, and a range of savory Cameroonian favorites and local drinks — all made fresh, by hand, from our home kitchen.'),
  ('about_paragraph_2', 'Whether you''re celebrating a birthday, hosting an event, or just craving something delicious, we''re here to make it sweeter — one order at a time.');

-- ============================================================
-- STORAGE — product photos
-- Bucket is public for reading (so photos display on the
-- storefront with no auth), write-protected by policy.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true);

create policy "public read product images" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "admin upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "admin update product images" on storage.objects
  for update using (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "admin delete product images" on storage.objects
  for delete using (bucket_id = 'product-images' and auth.role() = 'authenticated');
