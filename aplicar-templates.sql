-- Execute este SQL no Supabase para criar templates para SEU tenant

-- 1. Primeiro, descubra seu tenant_id
SELECT id, nome_empresa FROM tenants WHERE nome_empresa LIKE '%JOELSON%';

-- 2. Depois copie o tenant_id e execute a função abaixo
-- (Substitua 'SEU-TENANT-ID-AQUI' pelo ID que apareceu acima)

-- Exemplo:
-- SELECT criar_templates_padrao('c7f69c82-0968-4190-a26e-eb6005ee3a9c');
