-- ==========================================
-- ROLLBACK: Desabilitar RLS em itens_cotacao
-- ==========================================
-- Execute AGORA para voltar tudo ao normal!
-- ==========================================

-- DESABILITAR RLS (voltar ao estado original)
ALTER TABLE itens_cotacao DISABLE ROW LEVEL SECURITY;

-- REMOVER todas as policies
DROP POLICY IF EXISTS "Usuários podem ver itens das cotações do seu tenant" ON itens_cotacao;
DROP POLICY IF EXISTS "Sistema pode inserir itens de cotação" ON itens_cotacao;
DROP POLICY IF EXISTS "Usuários podem atualizar itens das cotações do seu tenant" ON itens_cotacao;
DROP POLICY IF EXISTS "Sistema pode deletar itens de cotação" ON itens_cotacao;

-- Confirmar
SELECT 'RLS desabilitado - sistema voltou ao normal' as status;
