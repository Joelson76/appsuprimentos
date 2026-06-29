-- 🚨 FIX EMERGENCIAL - Desabilitar RLS temporariamente
-- Execute no Supabase SQL Editor AGORA

-- OPÇÃO 1: Desabilitar RLS na tabela profiles (TEMPORÁRIO)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
-- Deve retornar: profiles | false

-- ✅ Isso permite o middleware funcionar temporariamente
-- ⚠️  ATENÇÃO: Remove isolamento multi-tenant em profiles
-- 📝 Depois de testar, reativar RLS e criar policies corretas
