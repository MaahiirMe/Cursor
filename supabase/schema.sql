-- DHHUH? catalogue + game persistence
-- Apply in Supabase when credentials are available.

create table if not exists artists (
  id text primary key,
  name text not null,
  normalized_name text not null,
  aliases text[] not null default '{}',
  country text not null default 'IN',
  scene_tags text[] not null default '{}',
  tier text not null default 'new',
  active boolean not null default true
);

create table if not exists tracks (
  id text primary key,
  title text not null,
  normalized_title text not null,
  primary_artist_id text not null references artists(id),
  aliases text[] not null default '{}',
  album text,
  release_year int,
  artwork_url text,
  youtube_video_id text,
  licensed_preview_url text,
  detected_start_seconds numeric,
  game_start_seconds numeric,
  start_verified boolean not null default false,
  recognition_score int not null default 50,
  source_playlists text[] not null default '{}',
  country text not null default 'IN',
  genre text not null default 'DHH',
  scene_tags text[] not null default '{}',
  difficulty int not null check (difficulty between 1 and 5),
  active boolean not null default false,
  intro_quality text not null default 'uncertain'
);

create table if not exists track_aliases (
  id uuid primary key default gen_random_uuid(),
  track_id text not null references tracks(id) on delete cascade,
  alias text not null
);

create table if not exists artist_aliases (
  id uuid primary key default gen_random_uuid(),
  artist_id text not null references artists(id) on delete cascade,
  alias text not null
);

create table if not exists playlist_sources (
  id text primary key,
  name text not null,
  kind text not null,
  note text
);

create table if not exists playlist_track_mappings (
  id uuid primary key default gen_random_uuid(),
  playlist_id text not null references playlist_sources(id),
  track_id text references tracks(id),
  raw_title text,
  raw_artists text,
  status text not null default 'review'
);

create table if not exists daily_sessions (
  daily_key date primary key,
  number int not null
);

create table if not exists daily_session_tracks (
  daily_key date references daily_sessions(daily_key),
  position int not null,
  track_id text not null references tracks(id),
  primary key (daily_key, position)
);

create table if not exists users (
  id uuid primary key,
  username text not null,
  normalized_username text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  unique (normalized_username)
);

create table if not exists player_stats (
  player_id uuid primary key references users(id) on delete cascade,
  sessions int not null default 0,
  tracks_attempted int not null default 0,
  correct int not null default 0,
  accuracy int not null default 0,
  total_score int not null default 0,
  best_score int not null default 0,
  average_listen int,
  perfect_two_second int not null default 0,
  streak int not null default 0,
  best_streak int not null default 0
);

create table if not exists game_sessions (
  id uuid primary key,
  number int not null,
  mode text not null,
  player_id uuid not null,
  daily_key date,
  replay boolean default false,
  status text not null,
  created_at timestamptz default now()
);

create table if not exists game_rounds (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  position int not null,
  track_id text not null,
  attempts_used int not null default 0,
  reveal_seconds int not null,
  outcome text not null,
  score int not null default 0
);

create table if not exists guesses (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references game_rounds(id) on delete cascade,
  selected_track_id text,
  selected_artist_id text,
  verdict text not null,
  created_at timestamptz default now()
);

create table if not exists leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null,
  username text not null,
  score int not null,
  solved int not null,
  mode text not null,
  daily_key date,
  verified boolean not null default false,
  created_at timestamptz default now()
);
