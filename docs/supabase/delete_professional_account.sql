-- Exclui profissional e usuário de login do Supabase Auth
-- Execute no SQL Editor do Supabase com uma conta admin

create or replace function public.delete_professional_account(
  p_professional_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
  v_user_id uuid;
begin
  -- Segurança: apenas admin autenticado pode excluir conta de profissional
  v_role := coalesce(
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() ->> 'role',
    ''
  );

  if v_role <> 'admin' then
    raise exception 'Apenas administradores podem excluir profissionais';
  end if;

  if p_professional_id is null then
    raise exception 'p_professional_id é obrigatório';
  end if;

  select user_id
    into v_user_id
    from public.profissionais
   where id = p_professional_id;

  if not found then
    raise exception 'Profissional não encontrado';
  end if;

  -- Remove registro da profissional
  delete from public.profissionais
   where id = p_professional_id;

  -- Remove usuário de login (quando houver vínculo)
  if v_user_id is not null then
    delete from auth.users
     where id = v_user_id;
  end if;
end;
$$;

revoke all on function public.delete_professional_account(uuid) from public;
grant execute on function public.delete_professional_account(uuid) to authenticated;
