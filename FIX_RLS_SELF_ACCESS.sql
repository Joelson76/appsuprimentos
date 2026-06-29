-- 🔧 FIX RLS - Permitir Self-Access em Profiles
-- Execute no Supabase SQL Editor

-- Problema: Policy atual só permite acesso por tenant_id
-- Mas em alguns contextos (middleware, APIs), tenant_id pode não estar no JWT ainda
-- Solução: Adicionar policy que permite usuário ler seu próprio profile

-- 1. Verificar policies atuais
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Adicionar policy de self-access (se não existir)
DO $$
BEGIN
  -- Dropar se existir (para recriar limpa)
  DROP POLICY IF EXISTS "profiles_self_access" ON profiles;

  -- Criar policy: usuário pode ler seu próprio profile
  CREATE POLICY "profiles_self_access"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

  RAISE NOTICE '✅ Policy profiles_self_access criada com sucesso';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE '⚠️  Policy profiles_self_access já existe';
END $$;

-- 3. Verificar que foi criada
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
  AND policyname = 'profiles_self_access';

-- Deve retornar:
-- policyname             | cmd    | qual
-- profiles_self_access   | SELECT | (auth.uid() = id)

-- 4. Testar (executar como usuário logado, não postgres):
-- SELECT * FROM profiles WHERE id = auth.uid();
-- Deve retornar SEU profile

-- ✅ DEPOIS DESTE FIX:
-- - Login deve funcionar
-- - Dashboard deve carregar
-- - Sem loops de redirect
-- - Service_role pode ser removido de alguns lugares
