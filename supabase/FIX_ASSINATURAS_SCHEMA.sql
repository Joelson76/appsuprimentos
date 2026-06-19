-- ==========================================
-- FIX: Corrigir schema da tabela assinaturas
-- ==========================================
-- Problema: Trigger tenta usar plano_id mas tabela tem campo plano (enum)
-- ==========================================

-- 1. Dropar o trigger antigo que causa o erro
DROP TRIGGER IF EXISTS auto_create_trial_subscription ON tenants;
DROP FUNCTION IF EXISTS auto_create_trial_subscription();

-- 2. Recriar a função correta (sem plano_id, usando plano enum)
CREATE OR REPLACE FUNCTION auto_create_trial_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar assinatura trial automaticamente
  INSERT INTO assinaturas (
    tenant_id,
    plano,
    valor_mensal,
    dia_vencimento,
    ativa
  ) VALUES (
    NEW.id,
    NEW.plano::text::tipo_plano,  -- Converter texto intermediário
    CASE NEW.plano::text
      WHEN 'BASICO' THEN 97.00
      WHEN 'PROFISSIONAL' THEN 297.00
      WHEN 'ENTERPRISE' THEN 997.00
    END,
    5,  -- dia 5 de cada mês
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recriar o trigger
CREATE TRIGGER auto_create_trial_subscription
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_trial_subscription();

-- Verificar
SELECT 'Trigger corrigido com sucesso!' as status;
