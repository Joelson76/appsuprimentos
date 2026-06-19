-- ==========================================
-- FIX: Criar profile faltante e recriar trigger
-- ==========================================
-- Problema: Trigger handle_new_user não existe, profiles não são criados
-- ==========================================

-- 1. Criar profile manualmente para o usuário BRZ (julio@opala29.com.br)
INSERT INTO profiles (id, tenant_id, nome, perfil, ativo)
VALUES (
  '044193d4-ae5a-406c-a8b7-153a3a3adfb0',
  '781f4797-37cd-4e5f-b411-14ffa5e3f88c',
  'JULIO',
  'ADMIN',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Recriar o trigger em auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 3. Criar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 4. Verificar se tudo foi criado
SELECT
  'Profile criado:' as tipo,
  COUNT(*) as quantidade
FROM profiles
WHERE id = '044193d4-ae5a-406c-a8b7-153a3a3adfb0'
UNION ALL
SELECT
  'Trigger criado:' as tipo,
  COUNT(*) as quantidade
FROM pg_trigger t
WHERE t.tgrelid = 'auth.users'::regclass
  AND t.tgname = 'on_auth_user_created'
  AND NOT t.tgisinternal;

-- Mensagem final
SELECT 'Profile criado e trigger recriado! Tente fazer login novamente.' as status;
