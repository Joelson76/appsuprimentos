-- ==========================================
-- FIX DEFINITIVO: Remover triggers antigos e conflitantes
-- ==========================================
-- Problema: Múltiplas migrations criaram triggers conflitantes
-- ==========================================

-- 1. Dropar TODOS os triggers relacionados a tenants/assinaturas
DROP TRIGGER IF EXISTS auto_create_trial_subscription ON tenants;
DROP TRIGGER IF EXISTS trg_tenant_auto_assinatura ON tenants;
DROP TRIGGER IF EXISTS trg_create_tenant_subscription ON tenants;
DROP TRIGGER IF EXISTS tenant_subscription_trigger ON tenants;

-- 2. Dropar TODAS as funções relacionadas
DROP FUNCTION IF EXISTS auto_create_trial_subscription();
DROP FUNCTION IF EXISTS auto_create_tenant_subscription();
DROP FUNCTION IF EXISTS create_tenant_subscription();
DROP FUNCTION IF EXISTS handle_new_tenant();

-- 3. Verificar qual estrutura a tabela assinaturas tem
DO $$
BEGIN
  -- Se a coluna plano_id existe, dropar
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assinaturas' AND column_name = 'plano_id'
  ) THEN
    ALTER TABLE assinaturas DROP COLUMN IF EXISTS plano_id CASCADE;
    RAISE NOTICE 'Coluna plano_id removida';
  END IF;

  -- Se a coluna plano não existe, adicionar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assinaturas' AND column_name = 'plano'
  ) THEN
    ALTER TABLE assinaturas ADD COLUMN plano tipo_plano NOT NULL DEFAULT 'BASICO';
    RAISE NOTICE 'Coluna plano adicionada';
  END IF;
END $$;

-- 4. Criar função CORRETA (sem plano_id, usando plano enum)
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
    NEW.plano::text::tipo_plano,  -- Converter de plano_tipo para tipo_plano via text
    CASE NEW.plano::text
      WHEN 'BASICO' THEN 149.00
      WHEN 'PROFISSIONAL' THEN 297.00
      WHEN 'ENTERPRISE' THEN 997.00
      ELSE 149.00
    END,
    5,  -- dia 5 de cada mês
    true
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar o trigger
CREATE TRIGGER auto_create_trial_subscription
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_trial_subscription();

-- 6. Verificar estrutura final
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'assinaturas'
  AND column_name IN ('plano', 'plano_id', 'tenant_id', 'valor_mensal')
ORDER BY ordinal_position;

-- Mensagem final
SELECT 'Assinaturas corrigidas! Estrutura usando campo "plano" (tipo_plano)' as status;
