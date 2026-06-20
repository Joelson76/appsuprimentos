-- ==========================================
-- SOLUÇÃO: Injetar tenant_id no JWT
-- ==========================================

-- 1. Criar função para atualizar app_metadata do usuário
CREATE OR REPLACE FUNCTION public.sync_user_metadata()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
BEGIN
  -- Para cada profile, atualizar o app_metadata do auth.users
  FOR rec IN
    SELECT p.id, p.tenant_id, p.perfil
    FROM profiles p
  LOOP
    -- Atualizar raw_app_meta_data no auth.users
    UPDATE auth.users
    SET raw_app_meta_data =
      COALESCE(raw_app_meta_data, '{}'::jsonb) ||
      jsonb_build_object(
        'tenant_id', rec.tenant_id::text,
        'perfil', rec.perfil::text
      )
    WHERE id = rec.id;

    RAISE NOTICE 'Atualizado user %', rec.id;
  END LOOP;
END;
$$;

-- 2. Executar a função para atualizar todos os usuários
SELECT public.sync_user_metadata();

-- 3. Verificar se funcionou
SELECT
  u.id,
  u.email,
  u.raw_app_meta_data->>'tenant_id' as tenant_id_no_jwt,
  u.raw_app_meta_data->>'perfil' as perfil_no_jwt,
  p.tenant_id as tenant_id_no_profile
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'joelson76@gmail.com';
