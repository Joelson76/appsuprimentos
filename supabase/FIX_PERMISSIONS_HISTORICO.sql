-- ==========================================
-- FIX: Permissões para historico_precos
-- ==========================================
-- Execute no Supabase SQL Editor
-- ==========================================

-- Dar permissão de INSERT para role authenticated (triggers usam essa role)
GRANT INSERT ON historico_precos TO authenticated;
GRANT SELECT ON historico_precos TO authenticated;
GRANT UPDATE ON historico_precos TO authenticated;
GRANT DELETE ON historico_precos TO authenticated;

-- Verificar
SELECT 'Permissões concedidas com sucesso!' as status;
