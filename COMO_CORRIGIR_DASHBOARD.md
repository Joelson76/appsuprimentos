# 🔧 Como Corrigir o Dashboard em Branco

## Problema
Após fazer login, o dashboard fica em branco. O erro é **permission denied** nas tabelas `profiles` e `tenants`.

## Causa
As políticas RLS (Row Level Security) não estão permitindo que usuários autenticados leiam seus próprios dados.

## Solução: Aplicar o Script de Permissões

### Passo 1: Abrir o Supabase SQL Editor

1. Acesse [https://supabase.com](https://supabase.com)
2. Entre no seu projeto
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**

### Passo 2: Copiar e Executar o Script

Copie todo o conteúdo do arquivo `supabase/FIX_COMPLETO.sql` e cole no editor SQL.

Ou execute este script simplificado:

```sql
-- ==========================================
-- FIX: Permissões e Políticas RLS
-- ==========================================

-- PASSO 1: Garantir permissões básicas
-- ==========================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

GRANT ALL PRIVILEGES ON public.profiles TO supabase_auth_admin;
GRANT ALL PRIVILEGES ON public.tenants TO supabase_auth_admin;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;

-- PASSO 2: Criar políticas RLS para profiles
-- ==========================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver seu próprio profile" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio profile" ON profiles;

-- Criar novas políticas
CREATE POLICY "Usuários podem ver seu próprio profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- PASSO 3: Criar políticas RLS para tenants
-- ==========================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver o tenant da sua empresa" ON tenants;

-- Criar nova política
CREATE POLICY "Usuários podem ver o tenant da sua empresa"
  ON tenants FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- PASSO 4: Recriar trigger handle_new_user
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

-- PASSO 5: Verificação
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Script executado com sucesso!';
  
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
    RAISE NOTICE '✅ Função handle_new_user existe';
  ELSE
    RAISE WARNING '❌ Função handle_new_user NÃO existe';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created existe';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created NÃO existe';
  END IF;
END $$;
```

### Passo 3: Executar o Script

Clique em **Run** (ou pressione `Ctrl+Enter`) para executar.

Você deve ver mensagens de sucesso:
- ✅ Função handle_new_user existe
- ✅ Trigger on_auth_user_created existe
- ✅ Script executado com sucesso!

### Passo 4: Testar o Dashboard

1. **Se você já tem um usuário cadastrado mas SEM profile:**
   - Você precisará criar um profile manualmente OU cadastrar um novo usuário

2. **Para criar profile manualmente:**

```sql
-- Substitua os valores abaixo
INSERT INTO profiles (id, tenant_id, nome, perfil)
VALUES (
  'ID_DO_SEU_USUARIO',  -- Pegue em Auth > Users
  'ID_DO_TENANT',        -- Pegue na tabela tenants
  'Seu Nome',
  'ADMIN'
);
```

3. **Para cadastrar novo usuário:**
   - Acesse http://localhost:3000/cadastro
   - Cadastre uma nova conta
   - Agora o trigger deve criar o profile automaticamente

4. **Teste o login:**
   - Acesse http://localhost:3000/login
   - Faça login
   - O dashboard deve aparecer corretamente!

## Verificação Final

Execute este comando para verificar se está tudo OK:

```sql
-- Ver todos os profiles criados
SELECT 
  p.id, 
  p.nome, 
  p.perfil, 
  t.nome as empresa,
  u.email
FROM profiles p
JOIN tenants t ON p.tenant_id = t.id
JOIN auth.users u ON p.id = u.id;
```

Deve retornar seus usuários com seus profiles e tenants associados.

## Ainda não funcionou?

Se após executar o script o dashboard continuar em branco:

1. **Abra o console do navegador** (F12 > Console)
2. **Procure por erros JavaScript**
3. **Verifique os logs do Next.js** no terminal onde rodou `npm run dev`
4. **Me envie a mensagem de erro** para eu ajudar mais

---

**Próximo passo após corrigir**: Implementar a Fase 6 (Integrações com Asaas, Resend, NF-e)
