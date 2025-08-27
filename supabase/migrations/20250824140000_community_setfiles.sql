-- Community Setfiles schema: files, runs, votes, ratings

create table if not exists public.community_setfiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text not null,
  file_path text not null,
  author text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_setfile_runs (
  id uuid primary key default gen_random_uuid(),
  setfile_id uuid not null references public.community_setfiles(id) on delete cascade,
  timeframe text not null,
  session text not null, -- e.g., "London", "NY", or specific hours
  notes text,
  created_at timestamptz not null default now(),
  user_id uuid references auth.users(id) on delete set null
);

create table if not exists public.community_setfile_votes (
  setfile_id uuid not null references public.community_setfiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  upvote boolean not null,
  created_at timestamptz not null default now(),
  primary key (setfile_id, user_id)
);

create table if not exists public.community_setfile_ratings (
  setfile_id uuid not null references public.community_setfiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (setfile_id, user_id)
);

-- Aggregates view for quick listing
create or replace view public.community_setfiles_view as
select f.*, coalesce(sum(case when v.upvote then 1 else -1 end),0) as score,
       coalesce(avg(r.rating), null) as avg_rating,
       coalesce(count(r.rating), 0) as rating_count
from public.community_setfiles f
left join public.community_setfile_votes v on v.setfile_id=f.id
left join public.community_setfile_ratings r on r.setfile_id=f.id
group by f.id;

-- RLS
alter table public.community_setfiles enable row level security;
alter table public.community_setfile_runs enable row level security;
alter table public.community_setfile_votes enable row level security;
alter table public.community_setfile_ratings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='community_setfiles' and policyname='read_all_setfiles') then
    create policy read_all_setfiles on public.community_setfiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='community_setfiles' and policyname='insert_own_setfiles') then
    create policy insert_own_setfiles on public.community_setfiles for insert with check (auth.uid() is not null);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='community_setfile_runs' and policyname='read_all_runs') then
    create policy read_all_runs on public.community_setfile_runs for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='community_setfile_runs' and policyname='insert_own_runs') then
    create policy insert_own_runs on public.community_setfile_runs for insert with check (auth.uid() is not null);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='community_setfile_votes' and policyname='read_all_votes') then
    create policy read_all_votes on public.community_setfile_votes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='community_setfile_votes' and policyname='upsert_own_votes') then
    create policy upsert_own_votes on public.community_setfile_votes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname='public' and tablename='community_setfile_ratings' and policyname='read_all_ratings') then
    create policy read_all_ratings on public.community_setfile_ratings for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='community_setfile_ratings' and policyname='upsert_own_ratings') then
    create policy upsert_own_ratings on public.community_setfile_ratings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

-- Simple helper RPCs
create or replace function public.community_upvote(p_setfile uuid, p_up boolean)
returns void
language plpgsql security definer as $$
begin
  insert into public.community_setfile_votes(setfile_id, user_id, upvote)
  values (p_setfile, auth.uid(), p_up)
  on conflict (setfile_id, user_id)
  do update set upvote = excluded.upvote, created_at = now();
end; $$;

grant execute on function public.community_upvote(uuid, boolean) to anon, authenticated;

create or replace function public.community_rate(p_setfile uuid, p_rating int)
returns void
language plpgsql security definer as $$
begin
  insert into public.community_setfile_ratings(setfile_id, user_id, rating)
  values (p_setfile, auth.uid(), p_rating)
  on conflict (setfile_id, user_id)
  do update set rating = excluded.rating, created_at = now();
end; $$;

grant execute on function public.community_rate(uuid, int) to anon, authenticated;





