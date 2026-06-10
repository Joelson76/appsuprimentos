-- ==========================================
-- FIX COMPLETO - Resolver todos os problemas de permissão
-- ==========================================

-- PASSO 1: Garantir que todas as roles têm as permissões necessárias
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

-- Permissões padrão para futuras tabelas
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

-- PASSO 2: Recriar a função handle_new_user com SECURITY DEFINER
-- ==========================================

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log para debug (visível nos logs do Supabase)
  RAISE NOTICE 'Criando profile para usuário %', NEW.id;

  -- Inserir profile
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

-- PASSO 3: Recriar o trigger
-- ==========================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- PASSO 4: Verificar que está tudo OK
-- ==========================================

DO $$
BEGIN
  -- Verificar se a função existe
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user'
  ) THEN
    RAISE NOTICE '✅ Função handle_new_user existe';
  ELSE
    RAISE WARNING '❌ Função handle_new_user NÃO existe';
  END IF;

  -- Verificar se o trigger existe
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created existe';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created NÃO existe';
  END IF;

  RAISE NOTICE '🎉 Setup completo!';
END $$;
