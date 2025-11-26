-- Create a table to store verification codes
create table if not exists public.verification_codes (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  code text not null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  unique(email)
);

-- Enable RLS
alter table public.verification_codes enable row level security;

-- Create policy to allow server-side (service role) full access
-- Since we will use this from API routes with service role, we don't strictly need policies for anon/authenticated if we don't expose it.
-- But for safety, we can deny all public access.
create policy "Deny all public access" on public.verification_codes
  for all using (false);

-- Grant access to service_role
grant all on public.verification_codes to service_role;
