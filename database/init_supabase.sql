create extension if not exists pgcrypto;

create table if not exists public.usuarios (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  nome_completo text,
  avatar_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nome_completo text not null,
  cep text,
  logradouro text,
  bairro text,
  cidade text,
  estado text,
  numero text,
  complemento text,
  avatar_url text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists idx_clientes_usuario_id on public.clientes (usuario_id);
create index if not exists idx_clientes_criado_em on public.clientes (criado_em desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists usuarios_set_updated_at on public.usuarios;
create trigger usuarios_set_updated_at
before update on public.usuarios
for each row
execute function public.set_updated_at();

drop trigger if exists clientes_set_updated_at on public.clientes;
create trigger clientes_set_updated_at
before update on public.clientes
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, email, nome_completo, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'nome_completo',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        nome_completo = coalesce(excluded.nome_completo, public.usuarios.nome_completo),
        avatar_url = coalesce(excluded.avatar_url, public.usuarios.avatar_url),
        atualizado_em = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.usuarios enable row level security;
alter table public.clientes enable row level security;

drop policy if exists "usuarios_select_own" on public.usuarios;
create policy "usuarios_select_own"
on public.usuarios
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "usuarios_update_own" on public.usuarios;
create policy "usuarios_update_own"
on public.usuarios
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "usuarios_insert_own" on public.usuarios;
create policy "usuarios_insert_own"
on public.usuarios
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "clientes_select_owner_or_admin" on public.clientes;
create policy "clientes_select_owner_or_admin"
on public.clientes
for select
to authenticated
using (
  usuario_id = auth.uid()
  or coalesce(auth.jwt() ->> 'email', '') in (
    'matos.almeida.flavio@gmail.com',
    'lucas.peixoto19@live.com',
    'biajudocarj542@gmail.com'
  )
);

drop policy if exists "clientes_insert_owner_or_admin" on public.clientes;
create policy "clientes_insert_owner_or_admin"
on public.clientes
for insert
to authenticated
with check (
  usuario_id = auth.uid()
  or coalesce(auth.jwt() ->> 'email', '') in (
    'matos.almeida.flavio@gmail.com',
    'lucas.peixoto19@live.com',
    'biajudocarj542@gmail.com'
  )
);

drop policy if exists "clientes_update_owner_or_admin" on public.clientes;
create policy "clientes_update_owner_or_admin"
on public.clientes
for update
to authenticated
using (
  usuario_id = auth.uid()
  or coalesce(auth.jwt() ->> 'email', '') in (
    'matos.almeida.flavio@gmail.com',
    'lucas.peixoto19@live.com',
    'biajudocarj542@gmail.com'
  )
)
with check (
  usuario_id = auth.uid()
  or coalesce(auth.jwt() ->> 'email', '') in (
    'matos.almeida.flavio@gmail.com',
    'lucas.peixoto19@live.com',
    'biajudocarj542@gmail.com'
  )
);

drop policy if exists "clientes_delete_owner_or_admin" on public.clientes;
create policy "clientes_delete_owner_or_admin"
on public.clientes
for delete
to authenticated
using (
  usuario_id = auth.uid()
  or coalesce(auth.jwt() ->> 'email', '') in (
    'matos.almeida.flavio@gmail.com',
    'lucas.peixoto19@live.com',
    'biajudocarj542@gmail.com'
  )
);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('client-avatars', 'client-avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "avatars_public_upload" on storage.objects;
create policy "avatars_public_upload"
on storage.objects
for insert
to public
with check (bucket_id = 'avatars');

drop policy if exists "client_avatars_public_read" on storage.objects;
create policy "client_avatars_public_read"
on storage.objects
for select
to public
using (bucket_id = 'client-avatars');

drop policy if exists "client_avatars_owner_upload" on storage.objects;
create policy "client_avatars_owner_upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'client-avatars'
  and name like auth.uid()::text || '/%'
);

drop policy if exists "client_avatars_owner_update" on storage.objects;
create policy "client_avatars_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'client-avatars'
  and name like auth.uid()::text || '/%'
)
with check (
  bucket_id = 'client-avatars'
  and name like auth.uid()::text || '/%'
);

drop policy if exists "client_avatars_owner_delete" on storage.objects;
create policy "client_avatars_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'client-avatars'
  and name like auth.uid()::text || '/%'
);
