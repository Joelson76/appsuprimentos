-- ==========================================
-- FIX: Aplicar RLS em TODAS as Tabelas com tenant_id
-- ==========================================
-- Esta migration garante que TODAS as tabelas com tenant_id
-- tenham RLS habilitado e as 4 policies corretas
-- ==========================================

-- Lista de todas as tabelas que precisam de RLS
-- (gerada automaticamente via query nas migrations)

-- 1. FORNECEDORES
DROP POLICY IF EXISTS "fornecedores_tenant" ON fornecedores;
DROP POLICY IF EXISTS "fornecedores_select" ON fornecedores;
DROP POLICY IF EXISTS "fornecedores_insert" ON fornecedores;
DROP POLICY IF EXISTS "fornecedores_update" ON fornecedores;
DROP POLICY IF EXISTS "fornecedores_delete" ON fornecedores;

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fornecedores_select" ON fornecedores FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "fornecedores_insert" ON fornecedores FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "fornecedores_update" ON fornecedores FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "fornecedores_delete" ON fornecedores FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 2. CATEGORIAS
DROP POLICY IF EXISTS "categorias_tenant" ON categorias;
DROP POLICY IF EXISTS "categorias_select" ON categorias;
DROP POLICY IF EXISTS "categorias_insert" ON categorias;
DROP POLICY IF EXISTS "categorias_update" ON categorias;
DROP POLICY IF EXISTS "categorias_delete" ON categorias;

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categorias_select" ON categorias FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "categorias_insert" ON categorias FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "categorias_update" ON categorias FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "categorias_delete" ON categorias FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 3. CENTROS_CUSTO
DROP POLICY IF EXISTS "centros_custo_tenant" ON centros_custo;
DROP POLICY IF EXISTS "centros_custo_select" ON centros_custo;
DROP POLICY IF EXISTS "centros_custo_insert" ON centros_custo;
DROP POLICY IF EXISTS "centros_custo_update" ON centros_custo;
DROP POLICY IF EXISTS "centros_custo_delete" ON centros_custo;

ALTER TABLE centros_custo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "centros_custo_select" ON centros_custo FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "centros_custo_insert" ON centros_custo FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "centros_custo_update" ON centros_custo FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "centros_custo_delete" ON centros_custo FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 4. REQUISICOES
DROP POLICY IF EXISTS "requisicoes_tenant" ON requisicoes;
DROP POLICY IF EXISTS "requisicoes_select" ON requisicoes;
DROP POLICY IF EXISTS "requisicoes_insert" ON requisicoes;
DROP POLICY IF EXISTS "requisicoes_update" ON requisicoes;
DROP POLICY IF EXISTS "requisicoes_delete" ON requisicoes;

ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "requisicoes_select" ON requisicoes FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "requisicoes_insert" ON requisicoes FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "requisicoes_update" ON requisicoes FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "requisicoes_delete" ON requisicoes FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 5. REGRAS_APROVACAO
DROP POLICY IF EXISTS "regras_aprovacao_tenant" ON regras_aprovacao;
DROP POLICY IF EXISTS "regras_aprovacao_select" ON regras_aprovacao;
DROP POLICY IF EXISTS "regras_aprovacao_insert" ON regras_aprovacao;
DROP POLICY IF EXISTS "regras_aprovacao_update" ON regras_aprovacao;
DROP POLICY IF EXISTS "regras_aprovacao_delete" ON regras_aprovacao;

ALTER TABLE regras_aprovacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "regras_aprovacao_select" ON regras_aprovacao FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "regras_aprovacao_insert" ON regras_aprovacao FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "regras_aprovacao_update" ON regras_aprovacao FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "regras_aprovacao_delete" ON regras_aprovacao FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 6. APROVACOES
DROP POLICY IF EXISTS "aprovacoes_tenant" ON aprovacoes;
DROP POLICY IF EXISTS "aprovacoes_select" ON aprovacoes;
DROP POLICY IF EXISTS "aprovacoes_insert" ON aprovacoes;
DROP POLICY IF EXISTS "aprovacoes_update" ON aprovacoes;
DROP POLICY IF EXISTS "aprovacoes_delete" ON aprovacoes;

ALTER TABLE aprovacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aprovacoes_select" ON aprovacoes FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "aprovacoes_insert" ON aprovacoes FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "aprovacoes_update" ON aprovacoes FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "aprovacoes_delete" ON aprovacoes FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 7. COTACOES
DROP POLICY IF EXISTS "cotacoes_tenant" ON cotacoes;
DROP POLICY IF EXISTS "cotacoes_select" ON cotacoes;
DROP POLICY IF EXISTS "cotacoes_insert" ON cotacoes;
DROP POLICY IF EXISTS "cotacoes_update" ON cotacoes;
DROP POLICY IF EXISTS "cotacoes_delete" ON cotacoes;

ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cotacoes_select" ON cotacoes FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "cotacoes_insert" ON cotacoes FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "cotacoes_update" ON cotacoes FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "cotacoes_delete" ON cotacoes FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 8. ORDENS_COMPRA (pedidos)
DROP POLICY IF EXISTS "ordens_compra_tenant" ON ordens_compra;
DROP POLICY IF EXISTS "ordens_compra_select" ON ordens_compra;
DROP POLICY IF EXISTS "ordens_compra_insert" ON ordens_compra;
DROP POLICY IF EXISTS "ordens_compra_update" ON ordens_compra;
DROP POLICY IF EXISTS "ordens_compra_delete" ON ordens_compra;

ALTER TABLE ordens_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ordens_compra_select" ON ordens_compra FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "ordens_compra_insert" ON ordens_compra FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "ordens_compra_update" ON ordens_compra FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "ordens_compra_delete" ON ordens_compra FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 9. PEDIDOS (nova tabela)
DROP POLICY IF EXISTS "pedidos_tenant" ON pedidos;
DROP POLICY IF EXISTS "pedidos_select" ON pedidos;
DROP POLICY IF EXISTS "pedidos_insert" ON pedidos;
DROP POLICY IF EXISTS "pedidos_update" ON pedidos;
DROP POLICY IF EXISTS "pedidos_delete" ON pedidos;

ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos_select" ON pedidos FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "pedidos_insert" ON pedidos FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "pedidos_update" ON pedidos FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "pedidos_delete" ON pedidos FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 10. RECEBIMENTOS
DROP POLICY IF EXISTS "recebimentos_tenant" ON recebimentos;
DROP POLICY IF EXISTS "recebimentos_select" ON recebimentos;
DROP POLICY IF EXISTS "recebimentos_insert" ON recebimentos;
DROP POLICY IF EXISTS "recebimentos_update" ON recebimentos;
DROP POLICY IF EXISTS "recebimentos_delete" ON recebimentos;

ALTER TABLE recebimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recebimentos_select" ON recebimentos FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "recebimentos_insert" ON recebimentos FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "recebimentos_update" ON recebimentos FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "recebimentos_delete" ON recebimentos FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 11. PROFILES
DROP POLICY IF EXISTS "profiles_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "profiles_delete" ON profiles FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 12. AUDIT_LOGS
DROP POLICY IF EXISTS "audit_logs_tenant" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_update" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete" ON audit_logs;

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "audit_logs_update" ON audit_logs FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "audit_logs_delete" ON audit_logs FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE '✅ RLS aplicado em TODAS as tabelas principais com tenant_id';
  RAISE NOTICE '📋 Execute AUDIT_RLS_MULTI_TENANT.sql para validar o resultado';
END $$;
