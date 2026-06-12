-- ==========================================
-- FIX: Auto-preencher tenant_id nas inserções
-- ==========================================
-- Cria trigger para preencher tenant_id automaticamente
-- baseado no JWT do usuário autenticado
-- ==========================================

-- Função genérica para preencher tenant_id
CREATE OR REPLACE FUNCTION auto_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := (auth.jwt()->'app_metadata'->>'tenant_id')::UUID;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em todas as tabelas que precisam

-- Contratos
DROP TRIGGER IF EXISTS auto_tenant_id_contratos ON contratos;
CREATE TRIGGER auto_tenant_id_contratos
  BEFORE INSERT ON contratos
  FOR EACH ROW EXECUTE FUNCTION auto_tenant_id();

-- Produtos
DROP TRIGGER IF EXISTS auto_tenant_id_produtos ON produtos;
CREATE TRIGGER auto_tenant_id_produtos
  BEFORE INSERT ON produtos
  FOR EACH ROW EXECUTE FUNCTION auto_tenant_id();

-- Movimentações de Estoque
DROP TRIGGER IF EXISTS auto_tenant_id_movimentacoes ON movimentacoes_estoque;
CREATE TRIGGER auto_tenant_id_movimentacoes
  BEFORE INSERT ON movimentacoes_estoque
  FOR EACH ROW EXECUTE FUNCTION auto_tenant_id();

-- Notas Fiscais
DROP TRIGGER IF EXISTS auto_tenant_id_notas_fiscais ON notas_fiscais;
CREATE TRIGGER auto_tenant_id_notas_fiscais
  BEFORE INSERT ON notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION auto_tenant_id();

-- Recebimentos
DROP TRIGGER IF EXISTS auto_tenant_id_recebimentos ON recebimentos;
CREATE TRIGGER auto_tenant_id_recebimentos
  BEFORE INSERT ON recebimentos
  FOR EACH ROW EXECUTE FUNCTION auto_tenant_id();

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Triggers de auto-preenchimento de tenant_id criados com sucesso';
  RAISE NOTICE 'Agora o tenant_id será preenchido automaticamente nas inserções';
END $$;
