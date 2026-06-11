-- ==========================================
-- Trigger para atualizar status da cotação
-- quando fornecedor responde
-- ==========================================

-- Função para verificar e atualizar status da cotação
CREATE OR REPLACE FUNCTION atualizar_status_cotacao_resposta()
RETURNS TRIGGER AS $$
DECLARE
  v_total_fornecedores INT;
  v_fornecedores_respondidos INT;
  v_status_atual TEXT;
BEGIN
  -- Só atualizar se o fornecedor preencheu o valor_unitario (respondeu)
  IF NEW.valor_unitario IS NOT NULL AND OLD.valor_unitario IS NULL THEN

    -- Pegar status atual da cotação
    SELECT status INTO v_status_atual
    FROM cotacoes
    WHERE id = NEW.cotacao_id;

    -- Só processar se a cotação ainda está aguardando respostas
    IF v_status_atual = 'AGUARDANDO_RESPOSTAS' THEN

      -- Contar total de fornecedores distintos nesta cotação
      SELECT COUNT(DISTINCT fornecedor_id) INTO v_total_fornecedores
      FROM itens_cotacao
      WHERE cotacao_id = NEW.cotacao_id;

      -- Contar quantos fornecedores já responderam (tem valor_unitario preenchido)
      SELECT COUNT(DISTINCT fornecedor_id) INTO v_fornecedores_respondidos
      FROM itens_cotacao
      WHERE cotacao_id = NEW.cotacao_id
        AND valor_unitario IS NOT NULL;

      -- Se todos responderam, marcar como EM_ANALISE
      -- Se pelo menos um respondeu, marcar como RESPOSTAS_PARCIAIS
      IF v_fornecedores_respondidos >= v_total_fornecedores THEN
        UPDATE cotacoes
        SET status = 'EM_ANALISE'
        WHERE id = NEW.cotacao_id;

        RAISE NOTICE 'Cotação % - Todos os fornecedores responderam. Status: EM_ANALISE', NEW.cotacao_id;
      ELSIF v_fornecedores_respondidos > 0 THEN
        UPDATE cotacoes
        SET status = 'RESPOSTAS_PARCIAIS'
        WHERE id = NEW.cotacao_id;

        RAISE NOTICE 'Cotação % - Resposta parcial (% de %)', NEW.cotacao_id, v_fornecedores_respondidos, v_total_fornecedores;
      END IF;

    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_atualizar_status_cotacao_resposta ON itens_cotacao;
CREATE TRIGGER trg_atualizar_status_cotacao_resposta
  AFTER UPDATE ON itens_cotacao
  FOR EACH ROW
  EXECUTE FUNCTION atualizar_status_cotacao_resposta();

-- Nota: Os novos status devem ser adicionados ao ENUM
-- Execute primeiro a migration 20260611000002_fix_status_enum.sql

-- Mensagem de confirmação
DO $$
BEGIN
  RAISE NOTICE 'Trigger de atualização de status criado com sucesso';
  RAISE NOTICE 'Novos status: RESPOSTAS_PARCIAIS, EM_ANALISE';
END $$;
