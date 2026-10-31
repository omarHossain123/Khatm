-- IRC Khatm Reflections: database schema
-- Run this whole file once in Supabase: SQL Editor -> New query -> paste -> Run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Admins: users listed here have full control. Add yourself after creating
-- your login (see README).
-- ---------------------------------------------------------------------------
create table if not exists admins (
  user_id uuid primary key references auth.users on delete cascade
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------------
-- Settings: the join code members need to post (shared in the group chat).
-- ---------------------------------------------------------------------------
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  join_code text not null default 'khatm'
);
insert into settings (id) values (1) on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Content: editable text, keyed by
--   'intro'          home page welcome text
--   'mufassal'       intro to the Mufassal group
--   'cluster:<n>'    cluster theme (0 = Al-Fatiha)
--   'surah:<n>'      surah theme
-- ---------------------------------------------------------------------------
create table if not exists content (
  key text primary key,
  body text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Posts, replies, reports
-- ---------------------------------------------------------------------------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  surah int not null check (surah between 1 and 114),
  ayah text check (char_length(ayah) <= 20),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  is_admin boolean not null default false,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_surah_idx on posts (surah, created_at desc);

create table if not exists replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists replies_post_idx on replies (post_id, created_at);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts on delete cascade,
  reply_id uuid references replies on delete cascade,
  created_at timestamptz not null default now(),
  check (num_nonnulls(post_id, reply_id) = 1)
);

create or replace view surah_counts with (security_invoker = on) as
  select surah, count(*)::int as posts from posts group by surah;

-- ---------------------------------------------------------------------------
-- Row level security
-- Everyone can read posts, replies and content. Members can only write
-- through the functions below (which check the join code). Admins can do
-- anything.
-- ---------------------------------------------------------------------------
alter table admins   enable row level security;
alter table settings enable row level security;
alter table content  enable row level security;
alter table posts    enable row level security;
alter table replies  enable row level security;
alter table reports  enable row level security;

drop policy if exists "admins read self" on admins;
create policy "admins read self" on admins for select using (user_id = auth.uid());

drop policy if exists "settings admin" on settings;
create policy "settings admin" on settings for all using (is_admin()) with check (is_admin());

drop policy if exists "content read" on content;
create policy "content read" on content for select using (true);
drop policy if exists "content admin" on content;
create policy "content admin" on content for all using (is_admin()) with check (is_admin());

drop policy if exists "posts read" on posts;
create policy "posts read" on posts for select using (true);
drop policy if exists "posts admin" on posts;
create policy "posts admin" on posts for all using (is_admin()) with check (is_admin());

drop policy if exists "replies read" on replies;
create policy "replies read" on replies for select using (true);
drop policy if exists "replies admin" on replies;
create policy "replies admin" on replies for all using (is_admin()) with check (is_admin());

drop policy if exists "reports admin" on reports;
create policy "reports admin" on reports for all using (is_admin()) with check (is_admin());

grant select on posts, replies, content, surah_counts to anon, authenticated;
grant insert, update, delete on posts, replies, content to authenticated;
grant select, insert, update, delete on reports, settings to authenticated;
grant select on admins to authenticated;

-- ---------------------------------------------------------------------------
-- Member actions (anonymous, gated by the join code)
-- ---------------------------------------------------------------------------
create or replace function check_join_code(p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from settings where join_code = p_code);
$$;

create or replace function create_post(p_code text, p_surah int, p_ayah text, p_body text)
returns posts language plpgsql security definer set search_path = public as $$
declare r posts;
begin
  if not check_join_code(p_code) then
    raise exception 'invalid join code';
  end if;
  insert into posts (surah, ayah, body)
  values (p_surah, nullif(trim(p_ayah), ''), trim(p_body))
  returning * into r;
  return r;
end $$;

create or replace function create_reply(p_code text, p_post_id uuid, p_body text)
returns replies language plpgsql security definer set search_path = public as $$
declare r replies;
begin
  if not check_join_code(p_code) then
    raise exception 'invalid join code';
  end if;
  insert into replies (post_id, body) values (p_post_id, trim(p_body)) returning * into r;
  return r;
end $$;

create or replace function report_content(p_post_id uuid, p_reply_id uuid)
returns void language sql security definer set search_path = public as $$
  insert into reports (post_id, reply_id) values (p_post_id, p_reply_id);
$$;

grant execute on function is_admin(), check_join_code(text),
  create_post(text, int, text, text), create_reply(text, uuid, text),
  report_content(uuid, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Starting content (edit any of this later from the site as admin)
-- ---------------------------------------------------------------------------
insert into content (key, body) values
('intro', $t$Assalamu alaikum! This is our space to reflect on the Quran together during the khatm. Pick a surah, share what stood out to you, ask questions, or respond to someone else's reflection. Everything here is anonymous.

These are personal reflections, not scholarly rulings. Be kind, and if something seems off, report it.$t$),

('cluster:0', $t$The key to the Quran. Everything after it is understood within the framework of Al-Fatiha, which is why every prayer begins with it.$t$),

('cluster:1', $t$You are a khaleefah. Here is your way of life, how to protect it, your value system, your obligations and rules, the parameters of your individual relationship with Allah and communal salvation, the laws of victory, and what relationships the Muslim nation should have with others.$t$),

('cluster:2', $t$Here are critical points that need to be observed within theology (Qada' and Qadar), the message (reform), ethics (consistency), and laws (righteousness). Without these critical points, Islam does not function.$t$),

('cluster:3', $t$Bounties must be thanked, acknowledged, seen as from Allah, and used according to His will, or the system will collapse.$t$),

('cluster:4', $t$You are responsible for carrying the message of Islam. The message needs proper establishment, strong families, understanding of its function, appropriate role models, resilience and flexibility to strive, investment in people, a pious community to carry it, caution from pitfalls, clear narratives, and balanced power to spread it.$t$),

('cluster:5', $t$Relationships are important. Learn to manage your relationships with people and their stories, the difficulties of life, the laws and signs of Allah, intergenerational relationships, and your relationship with Allah.$t$),

('cluster:6', $t$Obedience and submission are the cornerstone of a Muslim's life. Submission must occur when it is difficult, communities must obey as do individuals, obedience must be through knowledge and according to Allah's will, proper submission grants true life (life of the spirit), obedience must occur when the wisdom behind the commands is not clear, when one makes a mistake, obedience dictates correcting the mistake and returning to righteousness, and finally, spiritual obedience (sincerity) is equally important.$t$),

('cluster:7', $t$Advice and warnings on the path of spreading and serving the message. Take the message to those who argue against it and stay connected with Allah through the process. The best spreading of the message happens through character, as people will refuse to listen, and that is a reason for punishment. Consult those around you while holding on to your principles. Beware of the logic of materialism, missing the signs and clues while distracted, and beware of the arrogance that can come with knowledge. Finally, do your part, and Allah will decree whatever He sees fit.$t$),

('cluster:8', $t$Focusing on the Prophet ﷺ. In order for deeds to be accepted, they must be according to his teachings. Examples are given of those who followed his teachings and those who didn't, and then finally, the manners, etiquettes, and principles that the Prophet lived by.$t$),

('mufassal', $t$From Qaf to An-Nas, this group of surahs is called the "Mufassal," the comprehensive surahs. Within it are four clusters. The Mufassal summarizes all that the Quran went over in the previous surahs, covering the majority of the topics in a much more summarized and concise manner.$t$),

('cluster:9', $t$This cluster offers comparisons and choices for people to make regarding building their relationship with their deen. It starts with the ultimate comparison: living your life through Haqq versus Batil, taking the straight path versus not, and ultimately ending up in Jannah versus not. Then it asks: do you want to live with purposefulness or aimlessness, with guidance or without, and make life decisions based on authentic knowledge or on desires and assumptions?

Then it addresses blessings and bounties. Blessings are either used appropriately or will turn into curses, and blessings are either acknowledged and thanked for or lost. Then it offers the three groups of people that exist on the Day of Judgment and asks which one you want to be amongst. Finally, religion requires a balance of spirituality and materialism. Without this healthy balance, the faith collapses.$t$),

('cluster:10', $t$This cluster is focused on organizing Muslims within their communities and the organization of Muslim communities. Muslims must know the relationship they are obligated to have with each other, their spouses, and their leaders; the nature of citizenship within their country; the rules that dictate relationships with non-Muslim groups; the social contract Muslims have with their nation; the basis of leadership within the community; avoiding hypocrisy and how to deal with those who claim to be with you but do not contribute positively; avoiding the loss of pure intentions and the bigger picture as the community grows; relationships of civil law; and the importance of organizing family relationships.$t$),

('cluster:11', $t$This cluster addresses da'wah (spreading the message). It looks at the traits needed to fulfill this obligation: knowledge, values and ethics, spiritual attachment, and behaviors. Da'wah only works if Allah permits. It gives examples of proper da'wah, one that did not work despite best efforts, and one that did despite little effort. Finally, it gives examples of the three main types of da'wah: intellectual, encouragement-based, and warning-based.$t$),

('cluster:12', $t$The final cluster summarizes the faith's fundamental concepts and values. Some of the surahs are extremely short and concisely explain concepts that were detailed in previous surahs and clusters. It is divided into four groups of surahs.$t$)
on conflict (key) do nothing;
