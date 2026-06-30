-- FIX DEFINITIVO: Recursão infinita nas políticas RLS de profiles
-- Problema: NÃO PODEMOS fazer subquery em profiles dentro de policies de profiles!
-- Solução: Usar APENAS auth.uid() diretamente, SEM consultar profiles

-- Remover TODAS as políticas atuais de profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_super_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_own_tenant" ON profiles;

-- Garantir que RLS está ativo
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: SELECT - Ver apenas o próprio perfil (SIMPLES, SEM RECURSÃO)
-- IMPORTANTE: profiles é a tabela BASE para tenant_id, não pode consultar a si mesma!
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Policy 2: INSERT - Apenas durante criação via trigger
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Policy 3: UPDATE - Atualizar apenas o próprio perfil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy 4: DELETE - Proibido (CASCADE via tenant)
CREATE POLICY "profiles_delete_none" ON profiles
  FOR DELETE TO authenticated
  USING (false);

-- ✅ REGRA DE OURO: profiles é a SOURCE da verdade para tenant_id
-- OUTRAS tabelas consultam profiles.tenant_id
-- profiles NUNCA consulta profiles nas policies!

COMMENT ON TABLE profiles IS
'Tabela BASE de usuários. Policies usam APENAS auth.uid(), NUNCA fazem subquery em profiles (evita recursão).';
