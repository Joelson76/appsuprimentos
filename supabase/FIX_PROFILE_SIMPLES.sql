-- Corrigir profile do Joelson

INSERT INTO profiles (id, tenant_id, nome, perfil, ativo)
SELECT
  u.id,
  'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid,
  'Joelson',
  'SUPER_ADMIN'::perfil_usuario,
  true
FROM auth.users u
WHERE u.email = 'joelson76@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid,
  perfil = 'SUPER_ADMIN'::perfil_usuario,
  ativo = true;
