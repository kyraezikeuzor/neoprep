alter table public.skills
  add column if not exists generation_context text not null default '';
