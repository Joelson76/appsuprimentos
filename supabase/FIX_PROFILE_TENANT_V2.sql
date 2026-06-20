-- Primeiro, descobrir seu user_id
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- ============================================
-- DEPOIS DE VER SEU EMAIL ACIMA,
-- SUBSTITUA 'seu-email@exemplo.com' ABAIXO
-- E EXECUTE ESTA PARTE:
-- ============================================

-- Corrigir profile (SUBSTITUA O EMAIL!)
INSERT INTO profiles (id, tenant_id, nome, perfil, ativo)
SELECT
  u.id,
  'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid,
  'Joelson',
  'SUPER_ADMIN'::perfil_usuario,
  true
FROM auth.users u
WHERE u.email = 'joelson76@gmail.com'  -- <<<< CONFIRME SEU EMAIL AQUI
ON CONFLICT (id) DO UPDATE SET
  tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid,
  perfil = 'SUPER_ADMIN'::perfil_usuario,
  ativo = true;

-- Verificar
SELECT p.id, p.tenant_id, p.nome, p.perfil, u.email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'joelson76@gmail.com';
