-- Beat Pehchaan schema. Enable RLS. Never trust client-submitted scores.

create table if not exists public.artists (
  id text primary key,
  name text not null,
  slug text unique not null,
  aliases text[] not null default '{}',
  image_url text,
  scene_tags text[] not null default '{}'
);

create table if not exists public.tracks (
  id text primary key,
  title text not null,
  slug text unique not null,
  artists text[] not null,
  primary_artist text not null references public.artists(id),
  featured_artists text[] not null default '{}',
  aliases text[] not null default '{}',
  album text,
  artwork_url text,
  preview_url text,
  waveform_data double precision[] not null default '{}',
  release_year int,
  scene_tags text[] not null default '{}',
  language_tags text[] not null default '{}',
  difficulty int not null default 3,
  active boolean not null default true
);

create table if not exists public.daily_challenges (
  id text primary key,
  date date unique not null,
  challenge_number int not null,
  track_id text not null references public.tracks(id),
  difficulty int not null
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_seed text,
  xp int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.guesses (
  id bigint generated always as identity primary key,
  challenge_id text,
  user_id text not null,
  song_guess text,
  artist_guess text,
  song_correct boolean not null,
  artist_correct boolean not null,
  reveal_duration int not null,
  attempt int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_results (
  id bigint generated always as identity primary key,
  user_id text not null,
  mode text not null,
  track_id text not null,
  challenge_id text,
  score int not null,
  attempts int not null,
  reveal_duration int not null,
  correct boolean not null,
  practice boolean not null default false,
  xp int not null default 0,
  completed_at timestamptz not null default now()
);

create unique index if not exists game_results_daily_official
  on public.game_results (user_id, challenge_id)
  where mode = 'daily' and practice = false;

alter table public.artists enable row level security;
alter table public.tracks enable row level security;
alter table public.daily_challenges enable row level security;
alter table public.profiles enable row level security;
alter table public.guesses enable row level security;
alter table public.game_results enable row level security;

create policy "public read catalog" on public.artists for select using (true);
create policy "public read tracks" on public.tracks for select using (true);
create policy "public read daily" on public.daily_challenges for select using (true);

create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "insert own guesses" on public.guesses
  for insert with check (true);

create policy "read own results" on public.game_results
  for select using (user_id = auth.uid()::text or user_id like 'guest:%');
