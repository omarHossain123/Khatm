-- IRC Khatm Reflections: reactions (❤️ Love, 🤲 Ameen, 💡 Made me think)
-- Run once in Supabase after schema.sql: SQL Editor -> New snippet -> paste -> Run.
-- Safe to re-run.
--
-- Reactions are anonymous. Each browser has a random device id so it can react
-- once per reaction type and undo it. The table itself is not readable by
-- members; they only ever see counts, never which device reacted to what.

create table if not exists reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts on delete cascade,
  reply_id uuid references replies on delete cascade,
  kind text not null check (kind in ('love', 'ameen', 'think')),
  device_id uuid not null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(post_id, reply_id) = 1)
);
create unique index if not exists reactions_once_per_device
  on reactions (coalesce(post_id, reply_id), kind, device_id);

alter table reactions enable row level security;
drop policy if exists "reactions admin" on reactions;
create policy "reactions admin" on reactions for all using (is_admin()) with check (is_admin());
grant select, delete on reactions to authenticated;

-- Counts for every post and reply on a surah's page, plus whether this device reacted.
create or replace function surah_reactions(p_surah int, p_device uuid)
returns table (target_id uuid, kind text, count int, mine boolean)
language sql stable security definer set search_path = public as $$
  select coalesce(r.post_id, r.reply_id), r.kind, count(*)::int, bool_or(r.device_id = p_device)
  from reactions r
  left join posts p on p.id = r.post_id
  left join replies rp on rp.id = r.reply_id
  left join posts rpp on rpp.id = rp.post_id
  where coalesce(p.surah, rpp.surah) = p_surah
  group by 1, 2;
$$;

-- Adds the reaction, or removes it if this device already reacted. Returns true if now reacted.
create or replace function toggle_reaction(p_device uuid, p_post_id uuid, p_reply_id uuid, p_kind text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from reactions
  where device_id = p_device and kind = p_kind
    and post_id is not distinct from p_post_id
    and reply_id is not distinct from p_reply_id;
  if found then
    return false;
  end if;
  insert into reactions (post_id, reply_id, kind, device_id) values (p_post_id, p_reply_id, p_kind, p_device);
  return true;
end $$;

grant execute on function surah_reactions(int, uuid), toggle_reaction(uuid, uuid, uuid, text)
  to anon, authenticated;
