-- ============================================
-- DIAGNÓSTICO: Verificar usuários no sistema
-- ============================================

-- 1. Ver TODOS os usuários do auth.users (emails existentes)
SELECT
  '=== USUÁRIOS NO AUTH.USERS ===' as info,
  id,
  email,
  created_at,
  email_confirmed_at,
  CASE WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmado' ELSE '⚠️ Não confirmado' END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- 2. Ver TODOS os profiles existentes
SELECT
  '=== PROFILES EXISTENTES ===' as info,
  p.id,
  p.nome,
  p.perfil,
  p.tenant_id,
  p.criado_em,
  CASE WHEN p.tenant_id IS NULL THEN '❌ SEM TENANT' ELSE '✅ OK' END as status_tenant
FROM profiles p
ORDER BY p.criado_em DESC
LIMIT 20;

-- 3. Fazer JOIN para ver usuários COM profile
SELECT
  '=== USUÁRIOS COM PROFILE ===' as info,
  u.id,
  u.email,
  p.nome,
  p.perfil,
  p.tenant_id,
  CASE WHEN p.tenant_id IS NULL THEN '❌ SEM TENANT' ELSE '✅ TEM TENANT' END as status
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
ORDER BY u.created_at DESC
LIMIT 20;

-- 4. Usuários SEM profile (órfãos)
SELECT
  '=== USUÁRIOS SEM PROFILE (ÓRFÃOS) ===' as info,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 5. Profiles SEM tenant_id
SELECT
  '=== PROFILES SEM TENANT_ID ===' as info,
  p.id,
  p.nome,
  p.perfil,
  u.email
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.tenant_id IS NULL
ORDER BY p.criado_em DESC;

-- 6. Ver todos os tenants
SELECT
  '=== TODOS OS TENANTS ===' as info,
  id,
  nome,
  cnpj,
  status,
  criado_em
FROM tenants
ORDER BY criado_em DESC;
