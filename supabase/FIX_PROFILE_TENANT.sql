-- Corrigir profile do usuário logado

INSERT INTO profiles (id, tenant_id, nome, perfil, ativo)
VALUES (
  auth.uid(),
  'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid,
  'Joelson',
  'SUPER_ADMIN'::perfil_usuario,
  true
)
ON CONFLICT (id) DO UPDATE SET
  tenant_id = 'c7f69c82-0968-4190-a26e-eb6005ee3a9c'::uuid,
  perfil = 'SUPER_ADMIN'::perfil_usuario,
  ativo = true;

-- Verificar
SELECT id, tenant_id, nome, perfil FROM profiles WHERE id = auth.uid();
