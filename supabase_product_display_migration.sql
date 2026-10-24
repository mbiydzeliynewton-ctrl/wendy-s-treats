-- Run once in Supabase SQL Editor to add product detail fields and remove
-- the legacy emoji columns from an existing project. Detail fields stay
-- NULL until verified values are entered in the admin dashboard.
alter table public.products
  add column if not exists ingredients text,
  add column if not exists serving_size text,
  add column if not exists sugar_grams numeric(8,2),
  add column if not exists calories numeric(8,2);

alter table public.categories drop column if exists emoji;
alter table public.products drop column if exists emoji;
alter table public.posts drop column if exists emoji;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_sugar_grams_nonnegative'
  ) then
    alter table public.products
      add constraint products_sugar_grams_nonnegative
      check (sugar_grams is null or sugar_grams >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_calories_nonnegative'
  ) then
    alter table public.products
      add constraint products_calories_nonnegative
      check (calories is null or calories >= 0);
  end if;
end;
$$;
