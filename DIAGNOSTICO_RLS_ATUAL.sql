-- 🔍 DIAGNÓSTICO COMPLETO DO RLS

-- 1. Verificar quais tabelas têm RLS ativo
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'tenants', 'assinaturas', 'requisicoes', 'cotacoes', 'pedidos', 'fornecedores')
ORDER BY tablename;

-- 2. Ver TODAS as policies da tabela profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Ver policies da tabela assinaturas
SELECT
  policyname,
  cmd,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'assinaturas'
ORDER BY policyname;

-- 4. Testar se consegue ler próprio profile
-- Execute este SELECT como usuário logado (não postgres):
-- SELECT * FROM profiles WHERE id = auth.uid();
-- Se retornar dados = RLS OK
-- Se retornar vazio ou erro = RLS bloqueando

-- 5. Verificar se funções existem
SELECT
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname IN ('validar_token_cotacao', 'set_cotacao_token')
ORDER BY proname;
