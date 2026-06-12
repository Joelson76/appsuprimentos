-- ==========================================
-- FIX: Permitir UPDATE em tenants para admins
-- ==========================================

-- 1. Verificar policies atuais
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'tenants';

-- 2. Criar policy para UPDATE (se não existir)
DROP POLICY IF EXISTS "tenants_update_admin" ON tenants;

CREATE POLICY "tenants_update_admin" ON tenants
  FOR UPDATE
  USING (
    id IN (
      SELECT tenant_id
      FROM profiles
      WHERE id = auth.uid()
      AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
  WITH CHECK (
    id IN (
      SELECT tenant_id
      FROM profiles
      WHERE id = auth.uid()
      AND perfil IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- 3. Garantir permissões
GRANT UPDATE ON tenants TO authenticated;

-- 4. Verificar policies criadas
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'tenants'
ORDER BY cmd;
