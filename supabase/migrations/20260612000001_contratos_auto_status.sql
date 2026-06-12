-- ==========================================
-- FUNCTION: Atualizar status dos contratos automaticamente
-- ==========================================
-- Esta função atualiza o status dos contratos baseado na data atual:
-- - VENCENDO: quando está dentro do período de alerta (alerta_dias antes do fim)
-- - VENCIDO: quando passou da data de término
-- - ATIVO: quando está dentro da vigência normal
-- ==========================================

CREATE OR REPLACE FUNCTION atualizar_status_contratos()
RETURNS void AS $$
BEGIN
  -- Marcar como VENCIDO contratos que passaram da data de fim
  UPDATE contratos
  SET status = 'VENCIDO'
  WHERE status IN ('ATIVO', 'VENCENDO')
    AND fim < CURRENT_DATE;

  -- Marcar como VENCENDO contratos próximos do vencimento
  UPDATE contratos
  SET status = 'VENCENDO'
  WHERE status = 'ATIVO'
    AND fim >= CURRENT_DATE
    AND fim <= (CURRENT_DATE + (alerta_dias || ' days')::INTERVAL);

  -- Renovar automaticamente contratos vencidos com renovacao_auto = true
  UPDATE contratos
  SET
    inicio = fim + INTERVAL '1 day',
    fim = fim + (fim - inicio),
    status = 'EM_RENOVACAO'
  WHERE status = 'VENCIDO'
    AND renovacao_auto = true;

  RAISE NOTICE 'Status dos contratos atualizado com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Trigger: Executar automaticamente a cada dia
-- ==========================================
-- Nota: Isso requer pg_cron instalado no Supabase
-- Se não tiver pg_cron, pode executar manualmente ou via API

-- SELECT cron.schedule(
--   'atualizar-status-contratos-diario',
--   '0 0 * * *', -- Todo dia à meia-noite
--   $$SELECT atualizar_status_contratos()$$
-- );

-- ==========================================
-- Mensagem de confirmação
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE 'Função de atualização automática de status de contratos criada';
  RAISE NOTICE 'Para agendar execução diária, habilite pg_cron no Supabase';
END $$;

-- ==========================================
-- Executar uma vez agora para atualizar status existentes
-- ==========================================
SELECT atualizar_status_contratos();
