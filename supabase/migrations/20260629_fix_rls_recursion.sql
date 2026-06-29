-- Migration: Fix RLS Infinite Recursion on Profiles
-- Date: 2026-06-29
-- Issue: Multiple policies causing infinite recursion
-- Solution: Clean all policies and create simple ones

-- ============================================================
-- PROBLEMA RESOLVIDO:
-- Error: "infinite recursion detected in policy for relation profiles"
--
-- Causa: Múltiplas policies que se referenciam causando loop infinito
-- ============================================================

-- 1. Desabilitar RLS temporariamente (para limpar)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as policies antigas (evitar conflitos)
DROP POLICY IF EXISTS "profiles_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_self_access" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_system" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_simple_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- 3. Reativar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar policies SIMPLES sem recursão

-- Policy 1: SELECT - Usuário pode ler seu próprio profile
CREATE POLICY "profiles_simple_select"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy 2: UPDATE - Usuário pode atualizar seu próprio profile
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- RESULTADO ESPERADO:
-- ============================================================
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
--
-- Deve retornar apenas:
-- profiles_simple_select  | SELECT
-- profiles_update_own     | UPDATE
-- ============================================================

-- ============================================================
-- SEGURANÇA MANTIDA:
-- ============================================================
-- ✅ Usuário só acessa seu próprio profile
-- ✅ Sem recursão infinita
-- ✅ RLS ativo
-- ✅ Multi-tenant seguro (auth.uid() único por usuário)
-- ============================================================

-- ============================================================
-- OBSERVAÇÕES:
-- ============================================================
-- Esta migration corrige o problema identificado por Nika:
-- "RLS multi-tenant no Supabase costuma travar exatamente aí"
--
-- Solução aplicada: policies simples baseadas em auth.uid()
-- sem dependências circulares ou service_role desnecessário.
-- ============================================================
