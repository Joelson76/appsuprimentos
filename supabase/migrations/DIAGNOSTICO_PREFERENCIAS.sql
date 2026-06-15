-- ==========================================
-- DIAGNÓSTICO COMPLETO: preferencias_notificacao
-- ==========================================

-- 1. Verificar se a tabela existe
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'preferencias_notificacao') THEN
    RAISE NOTICE '✅ Tabela preferencias_notificacao EXISTE';
  ELSE
    RAISE NOTICE '❌ Tabela preferencias_notificacao NÃO EXISTE';
  END IF;
END $$;

-- 2. Verificar RLS
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE tablename = 'preferencias_notificacao';

-- 3. Listar todas as policies
SELECT
  policyname as nome_policy,
  cmd as comando,
  qual as expressao,
  with_check as with_check_expressao
FROM pg_policies
WHERE tablename = 'preferencias_notificacao';

-- 4. Verificar permissões da tabela
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'preferencias_notificacao';

-- 5. Testar se consegue inserir (como service_role)
DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Pegar primeiro usuário
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  -- Pegar primeiro tenant
  SELECT tenant_id INTO v_tenant_id FROM profiles WHERE id = v_user_id;

  IF v_user_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
    -- Tentar inserir
    INSERT INTO preferencias_notificacao (user_id, tenant_id)
    VALUES (v_user_id, v_tenant_id)
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET atualizado_em = NOW();

    RAISE NOTICE '✅ INSERT funcionou para user_id: %', v_user_id;
  ELSE
    RAISE NOTICE '❌ Nenhum usuário ou tenant encontrado para teste';
  END IF;
END $$;

-- 6. Contar registros
SELECT COUNT(*) as total_registros FROM preferencias_notificacao;

-- 7. Ver alguns registros
SELECT id, user_id, tenant_id, criado_em
FROM preferencias_notificacao
LIMIT 5;

-- ==========================================
-- RESULTADO
-- ==========================================
SELECT '=== DIAGNÓSTICO COMPLETO ===' as status;
