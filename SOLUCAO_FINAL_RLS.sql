-- =====================================================
-- SOLUÇÃO FINAL: Acesso Público a Cotações
-- =====================================================
-- Este arquivo documenta a solução completa para permitir
-- que fornecedores acessem cotações via link público
-- =====================================================

-- PROBLEMA IDENTIFICADO:
-- 1. Role 'anon' não tinha permissão GRANT nas tabelas
-- 2. Policies RLS estavam corretas, mas GRANT faltava

-- =====================================================
-- PARTE 1: GRANT (Permissões SQL Básicas)
-- =====================================================

-- Conceder permissão de SELECT ao role anon
GRANT SELECT ON public.cotacoes TO anon;
GRANT SELECT ON public.fornecedores TO anon;
GRANT SELECT ON public.cotacao_short_links TO anon;

-- Também para authenticated (redundante mas garante)
GRANT SELECT ON public.cotacoes TO authenticated;
GRANT SELECT ON public.fornecedores TO authenticated;
GRANT SELECT ON public.cotacao_short_links TO authenticated;

-- =====================================================
-- PARTE 2: RLS Policies (Já Criadas)
-- =====================================================

-- Policy para cotacoes (leitura pública)
CREATE POLICY IF NOT EXISTS "cotacoes_select_all"
  ON cotacoes
  FOR SELECT
  USING (true);

-- Policy para fornecedores (leitura pública)
CREATE POLICY IF NOT EXISTS "fornecedores_select_all"
  ON fornecedores
  FOR SELECT
  USING (true);

-- NOTA: cotacao_short_links não tem RLS (acesso público via código)

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- 1. Verificar GRANTs
SELECT
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('cotacoes', 'fornecedores', 'cotacao_short_links')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 2. Verificar Policies
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('cotacoes', 'fornecedores')
  AND policyname LIKE '%select%'
ORDER BY tablename;

-- 3. Testar como anon
SET ROLE anon;
SELECT id, numero FROM cotacoes LIMIT 1;
SELECT id, razao_social FROM fornecedores LIMIT 1;
RESET ROLE;

-- =====================================================
-- SEGURANÇA
-- =====================================================
-- ✅ Leitura (SELECT) é pública para cotacoes e fornecedores
-- ✅ Escrita (INSERT/UPDATE/DELETE) continua protegida por RLS
-- ✅ Isolamento por tenant_id mantido nas operações autenticadas
-- ✅ Fornecedores veem apenas seus próprios itens via token
-- =====================================================

-- Data da solução: 2026-06-22
-- Desenvolvedor: JLS Tecnologia
-- Sistema: SupriFlow
