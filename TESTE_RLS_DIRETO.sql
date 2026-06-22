-- =====================================================
-- TESTE DIRETO DE RLS - Simular acesso anônimo
-- =====================================================

-- 1. Ver TODAS as policies em cotacoes
SELECT
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'cotacoes'
ORDER BY policyname;

-- 2. Testar acesso como role anon (simular usuário não autenticado)
SET ROLE anon;

-- Tentar buscar uma cotação
SELECT id, numero, data_limite
FROM cotacoes
LIMIT 1;

-- Voltar ao role normal
RESET ROLE;

-- 3. Se o teste acima deu erro, o problema é que:
-- A) RLS está habilitado MAS
-- B) As policies PERMISSIVE não estão funcionando
-- C) Pode haver uma policy RESTRICTIVE bloqueando

-- Verificar se há policies RESTRICTIVE
SELECT
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('cotacoes', 'fornecedores')
  AND permissive = 'RESTRICTIVE';

-- 4. SOLUÇÃO TEMPORÁRIA: Desabilitar RLS para teste
-- ATENÇÃO: Isso é APENAS para testar se o problema é RLS
-- NÃO deixar assim em produção!

ALTER TABLE cotacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores DISABLE ROW LEVEL SECURITY;

-- Agora teste o link novamente no navegador
-- Se funcionar, o problema É o RLS

-- 5. REABILITAR RLS (IMPORTANTE!)
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SE FUNCIONAR COM RLS DESABILITADO:
-- =====================================================
-- Significa que as policies não estão sendo aplicadas
-- corretamente. Nesse caso, temos que recriar TODAS
-- as policies do zero.
-- =====================================================
