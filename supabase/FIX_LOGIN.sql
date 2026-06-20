-- Verificar e corrigir problema de login

-- 1. Ver o usuário (confirmar que existe)
SELECT
  id,
  email,
  email_confirmed_at,
  banned_until,
  deleted_at,
  raw_app_meta_data,
  raw_user_meta_data
FROM auth.users
WHERE email = 'joelson76@gmail.com';

-- 2. Se o usuário estiver ok mas não consegue logar,
-- pode ser problema com o app_metadata. Vamos limpar e recriar:

UPDATE auth.users
SET raw_app_meta_data = jsonb_build_object(
  'tenant_id', 'c7f69c82-0968-4190-a26e-eb6005ee3a9c',
  'perfil', 'SUPER_ADMIN',
  'provider', 'email',
  'providers', '["email"]'
)
WHERE email = 'joelson76@gmail.com';

-- 3. Verificar novamente
SELECT
  id,
  email,
  raw_app_meta_data
FROM auth.users
WHERE email = 'joelson76@gmail.com';
