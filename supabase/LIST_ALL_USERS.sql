-- Listar TODOS os usuários do sistema

SELECT
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmado,
  created_at,
  last_sign_in_at,
  raw_app_meta_data->>'perfil' as perfil
FROM auth.users
ORDER BY created_at DESC;
