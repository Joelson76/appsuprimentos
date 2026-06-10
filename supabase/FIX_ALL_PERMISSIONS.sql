-- ==========================================
-- FIX COMPLETO - Todas as permissões e políticas RLS
-- ==========================================
-- Execute este script no SQL Editor do Supabase
-- Este script configura TODAS as permissões necessárias
-- ==========================================

-- PARTE 1: PERMISSÕES BÁSICAS
-- ==========================================

-- Dar TODAS as permissões para service_role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Dar permissões para postgres (executa triggers)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;

-- Dar permissões para supabase_auth_admin (Supabase Auth)
GRANT ALL PRIVILEGES ON public.profiles TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON public.tenants TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- Dar permissões para authenticated (usuários logados)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicao_itens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacao_fornecedores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_itens TO authenticated;

-- Dar acesso às sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Permissões padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;

-- PARTE 2: TRIGGER handle_new_user
-- ==========================================

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE NOTICE 'Criando profile para usuário %', NEW.id;

  INSERT INTO public.profiles (id, tenant_id, nome, perfil)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'tenant_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'perfil')::public.perfil_usuario, 'COMPRADOR')
  );

  RAISE NOTICE 'Profile criado com sucesso para usuário %', NEW.id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar profile: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- PARTE 3: POLÍTICAS RLS - PROFILES
-- ==========================================

DROP POLICY IF EXISTS "Usuários podem ver seu próprio profile" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio profile" ON profiles;

CREATE POLICY "Usuários podem ver seu próprio profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- PARTE 4: POLÍTICAS RLS - TENANTS
-- ==========================================

DROP POLICY IF EXISTS "Usuários podem ver o tenant da sua empresa" ON tenants;

CREATE POLICY "Usuários podem ver o tenant da sua empresa"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- PARTE 5: POLÍTICAS RLS - REQUISICOES
-- ==========================================

DROP POLICY IF EXISTS "Usuários podem ver requisições do seu tenant" ON requisicoes;
DROP POLICY IF EXISTS "Usuários podem criar requisições no seu tenant" ON requisicoes;
DROP POLICY IF EXISTS "Usuários podem atualizar requisições do seu tenant" ON requisicoes;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias requisições em rascunho" ON requisicoes;

CREATE POLICY "Usuários podem ver requisições do seu tenant"
  ON requisicoes FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar requisições no seu tenant"
  ON requisicoes FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar requisições do seu tenant"
  ON requisicoes FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar suas próprias requisições em rascunho"
  ON requisicoes FOR DELETE
  TO authenticated
  USING (
    solicitante_id = auth.uid() AND status = 'RASCUNHO'
  );

-- PARTE 6: POLÍTICAS RLS - REQUISICAO_ITENS
-- ==========================================

DROP POLICY IF EXISTS "Usuários podem ver itens de requisições do seu tenant" ON requisicao_itens;
DROP POLICY IF EXISTS "Usuários podem criar itens no seu tenant" ON requisicao_itens;
DROP POLICY IF EXISTS "Usuários podem atualizar itens do seu tenant" ON requisicao_itens;
DROP POLICY IF EXISTS "Usuários podem deletar itens do seu tenant" ON requisicao_itens;

CREATE POLICY "Usuários podem ver itens de requisições do seu tenant"
  ON requisicao_itens FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar itens no seu tenant"
  ON requisicao_itens FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar itens do seu tenant"
  ON requisicao_itens FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar itens do seu tenant"
  ON requisicao_itens FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- PARTE 7: HABILITAR RLS EM TODAS AS TABELAS
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicao_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotacao_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;

-- PARTE 8: VERIFICAÇÃO FINAL
-- ==========================================

DO $$
DECLARE
  pol_count INTEGER;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'VERIFICAÇÃO DE PERMISSÕES E POLÍTICAS RLS';
  RAISE NOTICE '===========================================';

  -- Verificar função handle_new_user
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE NOTICE '✅ Função handle_new_user existe';
  ELSE
    RAISE WARNING '❌ Função handle_new_user NÃO existe';
  END IF;

  -- Verificar trigger
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created existe';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created NÃO existe';
  END IF;

  -- Verificar políticas RLS em profiles
  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'profiles';
  RAISE NOTICE '✅ Profiles: % política(s) RLS', pol_count;

  -- Verificar políticas RLS em tenants
  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'tenants';
  RAISE NOTICE '✅ Tenants: % política(s) RLS', pol_count;

  -- Verificar políticas RLS em requisicoes
  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'requisicoes';
  RAISE NOTICE '✅ Requisições: % política(s) RLS', pol_count;

  -- Verificar políticas RLS em requisicao_itens
  SELECT COUNT(*) INTO pol_count FROM pg_policies WHERE tablename = 'requisicao_itens';
  RAISE NOTICE '✅ Itens de Requisição: % política(s) RLS', pol_count;

  RAISE NOTICE '===========================================';
  RAISE NOTICE '🎉 SETUP COMPLETO!';
  RAISE NOTICE '===========================================';
END $$;
