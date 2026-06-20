-- Verificar status do usuário completo

SELECT
  id,
  email,
  email_confirmed_at,
  confirmation_token,
  banned_until,
  deleted_at,
  CASE
    WHEN email_confirmed_at IS NULL THEN '❌ EMAIL NÃO CONFIRMADO'
    WHEN banned_until IS NOT NULL AND banned_until > NOW() THEN '❌ USUÁRIO BANIDO'
    WHEN deleted_at IS NOT NULL THEN '❌ USUÁRIO DELETADO'
    ELSE '✅ USUÁRIO OK'
  END as status
FROM auth.users
WHERE email = 'joelson76@gmail.com';

-- Se email não estiver confirmado, confirmar agora:
UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  confirmation_token = NULL
WHERE email = 'joelson76@gmail.com'
AND email_confirmed_at IS NULL;

-- Verificar novamente
SELECT
  email,
  email_confirmed_at,
  confirmed_at
FROM auth.users
WHERE email = 'joelson76@gmail.com';
