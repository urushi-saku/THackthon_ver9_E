-- Supabase SQL Editorで実行する、担当Aの最小スキーマ。
create extension if not exists pgcrypto;

create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null check (char_length(display_name) between 1 and 50),
    university text,
    department text,
    grade smallint check (grade between 1 and 6),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
    id uuid primary key default gen_random_uuid(),
    course_id text not null,
    user_id uuid not null references public.users(id) on delete cascade,
    rating smallint not null check (rating between 1 and 5),
    content text not null check (char_length(content) between 1 and 2000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists reviews_course_id_created_at_idx
    on public.reviews (course_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.reviews enable row level security;

-- ログイン済みユーザーは全プロフィールを参照可能。
drop policy if exists "authenticated users can read profiles" on public.users;
create policy "authenticated users can read profiles"
on public.users for select
to authenticated
using (true);

drop policy if exists "users can insert their own profile" on public.users;
create policy "users can insert their own profile"
on public.users for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "users can update their own profile" on public.users;
create policy "users can update their own profile"
on public.users for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- 口コミはログイン済みユーザーが閲覧し、自分のものだけ投稿可能。
drop policy if exists "authenticated users can read reviews" on public.reviews;
create policy "authenticated users can read reviews"
on public.reviews for select
to authenticated
using (true);

drop policy if exists "users can insert their own reviews" on public.reviews;
create policy "users can insert their own reviews"
on public.reviews for insert
to authenticated
with check ((select auth.uid()) = user_id);
