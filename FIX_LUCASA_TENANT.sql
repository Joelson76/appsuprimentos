-- ============================================
-- SCRIPT PARA CORRIGIR TENANT_ID DO ADMIN
-- Usuário: lucasa@aesa.com.br
-- ============================================

-- PASSO 1: Ver estado atual do profile (JOIN com auth.users para pegar email)
SELECT
  '=== ESTADO ATUAL DO PROFILE ===' as info,
  p.id,
  u.email,
  p.nome,
  p.perfil,
  p.tenant_id as tenant_atual,
  CASE WHEN p.tenant_id IS NULL THEN '❌ NULL (PROBLEMA!)' ELSE '✅ OK' END as status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'lucasa@aesa.com.br';

-- PASSO 2: Ver tenants disponíveis
SELECT
  '=== TENANTS DISPONÍVEIS ===' as info,
  id as tenant_id,
  nome,
  cnpj,
  status,
  criado_em
FROM tenants
ORDER BY criado_em DESC;

-- PASSO 3: EXECUTAR CORREÇÃO AUTOMÁTICA
DO $$
DECLARE
  v_profile_id UUID;
  v_tenant_id UUID;
  v_tenant_nome TEXT;
BEGIN
  RAISE NOTICE '🔧 Iniciando correção do tenant_id...';

  -- Buscar o ID do profile via auth.users
  SELECT p.id INTO v_profile_id
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'lucasa@aesa.com.br';

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION '❌ Profile não encontrado para lucasa@aesa.com.br';
  END IF;

  RAISE NOTICE '✅ Profile encontrado: %', v_profile_id;

  -- Buscar o tenant (tenta por nome/cnpj AESA primeiro)
  SELECT id, nome INTO v_tenant_id, v_tenant_nome
  FROM tenants
  WHERE cnpj LIKE '%AESA%'
     OR nome ILIKE '%AESA%'
     OR nome ILIKE '%A.E.S.A%'
  ORDER BY criado_em DESC
  LIMIT 1;

  -- Se não encontrou por AESA, pega o primeiro tenant criado
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '⚠️ Tenant AESA não encontrado, usando primeiro tenant disponível...';

    SELECT id, nome INTO v_tenant_id, v_tenant_nome
    FROM tenants
    WHERE status = 'ATIVO' OR status IS NULL
    ORDER BY criado_em ASC
    LIMIT 1;
  END IF;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION '❌ Nenhum tenant encontrado no sistema!';
  END IF;

  RAISE NOTICE '✅ Tenant encontrado: % (nome: %)', v_tenant_id, v_tenant_nome;

  -- Atualizar o profile
  UPDATE profiles
  SET tenant_id = v_tenant_id
  WHERE id = v_profile_id;

  RAISE NOTICE '✅ Profile atualizado com sucesso!';
  RAISE NOTICE '   - Profile ID: %', v_profile_id;
  RAISE NOTICE '   - Tenant ID: %', v_tenant_id;
  RAISE NOTICE '   - Tenant Nome: %', v_tenant_nome;
END $$;

-- PASSO 4: Verificar que foi corrigido
SELECT
  '=== VERIFICAÇÃO FINAL ===' as info,
  p.id,
  u.email,
  p.nome,
  p.perfil,
  p.tenant_id,
  t.nome as tenant_nome,
  t.cnpj as tenant_cnpj,
  CASE WHEN p.tenant_id IS NOT NULL THEN '✅ CORRIGIDO!' ELSE '❌ AINDA NULL' END as status
FROM profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN tenants t ON t.id = p.tenant_id
WHERE u.email = 'lucasa@aesa.com.br';

-- PASSO 5: Listar todos os usuários desse tenant
SELECT
  '=== USUÁRIOS DO MESMO TENANT ===' as info,
  p.id,
  u.email,
  p.nome,
  p.perfil,
  p.criado_em
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.tenant_id = (
  SELECT p2.tenant_id
  FROM profiles p2
  JOIN auth.users u2 ON u2.id = p2.id
  WHERE u2.email = 'lucasa@aesa.com.br'
)
ORDER BY p.criado_em DESC;
