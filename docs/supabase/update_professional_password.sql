-- Cria função RPC para o administrativo trocar senha da profissional
-- Execute no SQL Editor do Supabase com uma conta admin

create extension if not exists pgcrypto with schema extensions;

create or replace function public.update_professional_password(
  p_user_id uuid,
  p_password text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'p_user_id é obrigatório';
  end if;

  if p_password is null or length(trim(p_password)) < 6 then
    raise exception 'Senha deve ter no mínimo 6 caracteres';
  end if;

  -- Atualiza senha no Supabase Auth
  update auth.users
     set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
         updated_at = now()
   where id = p_user_id;

  if not found then
    raise exception 'Usuário não encontrado em auth.users';
  end if;
end;
$$;

revoke all on function public.update_professional_password(uuid, text) from public;
grant execute on function public.update_professional_password(uuid, text) to authenticated;
