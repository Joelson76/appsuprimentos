-- Script para verificar se o admin tem tenant_id

-- Verificar perfis sem tenant_id
SELECT
  id,
  nome,
  email,
  perfil,
  tenant_id,
  criado_em
FROM profiles
WHERE perfil IN ('ADMIN', 'SUPER_ADMIN')
ORDER BY criado_em DESC;

-- Se houver admins sem tenant_id, isso precisa ser corrigido!
-- Para corrigir, execute (substituindo os IDs):
-- UPDATE profiles
-- SET tenant_id = (SELECT id FROM tenants WHERE cnpj = 'SEU_CNPJ_AQUI')
-- WHERE id = 'ID_DO_PROFILE_AQUI';
