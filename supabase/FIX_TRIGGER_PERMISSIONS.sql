-- ==========================================
-- FIX: Permissões para o trigger handle_new_user
-- ==========================================

-- 1. Garantir que a função existe
-- (se você aplicou a Fase 1, ela já existe)

-- 2. Dar permissão SECURITY DEFINER para a função executar com privilégios elevados
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- O tenant_id e perfil vêm dos raw_user_meta_data passados no signUp
  INSERT INTO public.profiles (id, tenant_id, nome, perfil)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'tenant_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'perfil')::perfil_usuario, 'COMPRADOR')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. Garantir permissões para postgres (role que executa triggers)
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.tenants TO postgres;

-- 5. Dar permissão para supabase_auth_admin (role do Supabase Auth)
GRANT ALL ON public.profiles TO supabase_auth_admin;
GRANT ALL ON public.tenants TO supabase_auth_admin;

-- 6. Garantir que authenticated pode ver seu próprio profile
GRANT SELECT ON public.profiles TO authenticated;

-- ==========================================
-- PRONTO! Agora o cadastro deve funcionar
-- ==========================================
