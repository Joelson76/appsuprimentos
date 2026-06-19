-- ==========================================
-- SEED: Inserir planos de preços
-- ==========================================
-- Execute este SQL no Supabase SQL Editor se os planos não aparecerem

-- Verificar se a tabela existe
SELECT * FROM planos_precos;

-- Se estiver vazia, inserir os planos:
INSERT INTO planos_precos (plano, nome, valor_mensal, max_usuarios, descricao, recursos) VALUES
('BASICO', 'Básico', 149.00, 5, 'Ideal para pequenas empresas',
  '["5 usuários", "Requisições ilimitadas", "Cotações ilimitadas", "Suporte por email"]'::JSONB),
('PROFISSIONAL', 'Profissional', 297.00, 20, 'Para empresas em crescimento',
  '["20 usuários", "Todos recursos do Básico", "Gestão de contratos", "Gestão de estoque", "Suporte prioritário"]'::JSONB),
('ENTERPRISE', 'Enterprise', 997.00, NULL, 'Para grandes empresas',
  '["Usuários ilimitados", "Todos recursos", "API dedicada", "Suporte 24/7", "Gerente de conta"]'::JSONB)
ON CONFLICT (plano) DO UPDATE SET
  nome = EXCLUDED.nome,
  valor_mensal = EXCLUDED.valor_mensal,
  max_usuarios = EXCLUDED.max_usuarios,
  descricao = EXCLUDED.descricao,
  recursos = EXCLUDED.recursos;

-- Verificar inserção
SELECT * FROM planos_precos ORDER BY valor_mensal;
