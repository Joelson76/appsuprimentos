-- ============================================
-- FIX: Permissões da tabela email_templates
-- ============================================
-- Execute no Supabase SQL Editor
-- ============================================

-- Dar permissões para o role authenticated
GRANT SELECT ON public.email_templates TO authenticated;
GRANT INSERT ON public.email_templates TO authenticated;
GRANT UPDATE ON public.email_templates TO authenticated;
GRANT DELETE ON public.email_templates TO authenticated;

-- Dar permissão para usar a sequence (IDs)
GRANT USAGE ON SEQUENCE email_templates_id_seq TO authenticated;

-- Verificar permissões
SELECT
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'email_templates';

-- ============================================
-- Pronto! Agora acesse:
-- http://localhost:3000/configuracoes/templates-email
-- ============================================
