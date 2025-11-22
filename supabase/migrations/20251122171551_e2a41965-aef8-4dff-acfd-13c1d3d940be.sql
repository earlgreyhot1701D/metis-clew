-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- RLS policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create code_snippets table
create table public.code_snippets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  code text not null,
  language text default 'python' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on code_snippets
alter table public.code_snippets enable row level security;

-- RLS policies for code_snippets
create policy "Users can view their own code snippets"
  on public.code_snippets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own code snippets"
  on public.code_snippets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own code snippets"
  on public.code_snippets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own code snippets"
  on public.code_snippets for delete
  using (auth.uid() = user_id);

-- Create explanations table
create table public.explanations (
  id uuid default uuid_generate_v4() primary key,
  snippet_id uuid references public.code_snippets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  selected_code text not null,
  explanation jsonb not null,
  position jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on explanations
alter table public.explanations enable row level security;

-- RLS policies for explanations
create policy "Users can view their own explanations"
  on public.explanations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own explanations"
  on public.explanations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own explanations"
  on public.explanations for delete
  using (auth.uid() = user_id);

-- Create learning_patterns table
create table public.learning_patterns (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pattern_type text not null,
  frequency integer default 1 not null,
  last_seen timestamp with time zone default timezone('utc'::text, now()) not null,
  insights jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, pattern_type)
);

-- Enable RLS on learning_patterns
alter table public.learning_patterns enable row level security;

-- RLS policies for learning_patterns
create policy "Users can view their own learning patterns"
  on public.learning_patterns for select
  using (auth.uid() = user_id);

create policy "Users can insert their own learning patterns"
  on public.learning_patterns for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own learning patterns"
  on public.learning_patterns for update
  using (auth.uid() = user_id);

-- Create trigger function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

create trigger handle_code_snippets_updated_at
  before update on public.code_snippets
  for each row
  execute function public.handle_updated_at();

-- Create trigger function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Create trigger for new user profile creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();