create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  answer_length text not null default 'adaptive' check (answer_length in ('short', 'detailed', 'adaptive')),
  response_mode text not null default 'advice' check (response_mode in ('advice', 'listening')),
  format_mode text not null default 'adaptive' check (format_mode in ('structured', 'conversational', 'adaptive')),
  tone text not null default 'gentle' check (tone in ('gentle', 'direct')),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_summaries (
  session_id uuid primary key references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.message_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  feedback text not null check (feedback in ('helpful', 'too_vague', 'too_long', 'not_relevant', 'more_detail')),
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

create table if not exists public.mood_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null check (mood in ('sad', 'negative', 'neutral', 'positive', 'happy')),
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

alter table public.user_preferences enable row level security;
alter table public.session_summaries enable row level security;
alter table public.message_feedback enable row level security;
alter table public.mood_logs enable row level security;

drop policy if exists "Users manage their preferences" on public.user_preferences;
drop policy if exists "Users manage their summaries" on public.session_summaries;
drop policy if exists "Users manage their feedback" on public.message_feedback;
drop policy if exists "Users manage their mood logs" on public.mood_logs;

create policy "Users manage their preferences" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their summaries" on public.session_summaries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their feedback" on public.message_feedback for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their mood logs" on public.mood_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
