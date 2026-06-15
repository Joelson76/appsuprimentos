-- ==========================================
-- FIX: GRANTS para preferencias_notificacao
-- Dar permissões básicas para role authenticated
-- ==========================================

-- Dar permissões para a role authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preferencias_notificacao TO authenticated;

-- Dar permissão para usar a sequence (se houver)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==========================================
-- VERIFICAR
-- ==========================================
DO $$
DECLARE
  v_grants TEXT;
BEGIN
  SELECT string_agg(privilege_type, ', ') INTO v_grants
  FROM information_schema.table_privileges
  WHERE table_name = 'preferencias_notificacao'
    AND grantee = 'authenticated';

  RAISE NOTICE '================================================';
  RAISE NOTICE 'GRANTS para preferencias_notificacao';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Role authenticated tem: %', COALESCE(v_grants, 'NENHUMA PERMISSÃO');
  RAISE NOTICE '================================================';
END $$;

SELECT '✅ GRANTS aplicados com sucesso!' as status;
