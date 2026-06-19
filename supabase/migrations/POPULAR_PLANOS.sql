-- ==========================================
-- POPULAR TABELA PLANOS_PRECOS
-- ==========================================

-- Limpar dados antigos
TRUNCATE TABLE planos_precos CASCADE;

-- Inserir planos
INSERT INTO planos_precos (plano, nome, valor_mensal, max_usuarios, descricao, recursos) VALUES
('BASICO', 'Básico', 149.00, 5, 'Ideal para pequenas empresas',
  '["5 usuários", "Requisições ilimitadas", "Cotações ilimitadas", "Suporte por email"]'::JSONB),
('PROFISSIONAL', 'Profissional', 297.00, 20, 'Para empresas em crescimento',
  '["20 usuários", "Todos recursos do Básico", "Gestão de contratos", "Gestão de estoque", "Suporte prioritário"]'::JSONB),
('ENTERPRISE', 'Enterprise', 997.00, NULL, 'Para grandes empresas',
  '["Usuários ilimitados", "Todos recursos", "API dedicada", "Suporte 24/7", "Gerente de conta"]'::JSONB);

-- Dar permissões públicas
GRANT SELECT ON public.planos_precos TO anon;
GRANT SELECT ON public.planos_precos TO authenticated;

-- ==========================================
-- VERIFICAR
-- ==========================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM planos_precos;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'PLANOS POPULADOS';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ % planos inseridos', v_count;
  RAISE NOTICE '✅ Permissions: anon e authenticated';
  RAISE NOTICE '================================================';
END $$;

SELECT plano, nome, valor_mensal, max_usuarios FROM planos_precos ORDER BY valor_mensal;
