-- ==========================================
-- INSERIR PLANOS - EXECUTAR NO SUPABASE
-- ==========================================

-- Inserir os 3 planos
INSERT INTO planos_precos (plano, nome, valor_mensal, max_usuarios, descricao, recursos) VALUES
('BASICO', 'Básico', 149.00, 5, 'Ideal para pequenas empresas',
  '["5 usuários", "Requisições ilimitadas", "Cotações ilimitadas", "Suporte por email"]'::JSONB),
('PROFISSIONAL', 'Profissional', 297.00, 20, 'Para empresas em crescimento',
  '["20 usuários", "Todos recursos do Básico", "Gestão de contratos", "Gestão de estoque", "Suporte prioritário"]'::JSONB),
('ENTERPRISE', 'Enterprise', 997.00, NULL, 'Para grandes empresas',
  '["Usuários ilimitados", "Todos recursos", "API dedicada", "Suporte 24/7", "Gerente de conta"]'::JSONB)
ON CONFLICT (plano) DO NOTHING;

-- Verificar
SELECT * FROM planos_precos ORDER BY valor_mensal;
