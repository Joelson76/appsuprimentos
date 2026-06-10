# 🔧 APLICAR PERMISSÕES AGORA - Guia Rápido

## ⚠️ Você está vendo o erro: `permission denied for table requisicoes`

**Solução**: Execute o script SQL no Supabase (leva 10 segundos)

---

## 📋 Passo a Passo

### 1️⃣ Abra o Supabase SQL Editor

1. Acesse: https://supabase.com
2. Entre no seu projeto
3. Clique em **SQL Editor** no menu lateral esquerdo
4. Clique em **+ New Query**

### 2️⃣ Copie o Script

Abra o arquivo `supabase/FIX_ALL_PERMISSIONS.sql` e copie TODO o conteúdo.

**OU** copie este script simplificado:

```sql
-- PERMISSÕES BÁSICAS
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Permissões para usuários autenticados
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.tenants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requisicao_itens TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- POLÍTICAS RLS - PROFILES
DROP POLICY IF EXISTS "Usuários podem ver seu próprio profile" ON profiles;
CREATE POLICY "Usuários podem ver seu próprio profile"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- POLÍTICAS RLS - TENANTS
DROP POLICY IF EXISTS "Usuários podem ver o tenant da sua empresa" ON tenants;
CREATE POLICY "Usuários podem ver o tenant da sua empresa"
  ON tenants FOR SELECT TO authenticated
  USING (id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- POLÍTICAS RLS - REQUISICOES
DROP POLICY IF EXISTS "Usuários podem ver requisições do seu tenant" ON requisicoes;
CREATE POLICY "Usuários podem ver requisições do seu tenant"
  ON requisicoes FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem criar requisições no seu tenant" ON requisicoes;
CREATE POLICY "Usuários podem criar requisições no seu tenant"
  ON requisicoes FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem atualizar requisições do seu tenant" ON requisicoes;
CREATE POLICY "Usuários podem atualizar requisições do seu tenant"
  ON requisicoes FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- POLÍTICAS RLS - REQUISICAO_ITENS
DROP POLICY IF EXISTS "Usuários podem ver itens de requisições do seu tenant" ON requisicao_itens;
CREATE POLICY "Usuários podem ver itens de requisições do seu tenant"
  ON requisicao_itens FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem criar itens no seu tenant" ON requisicao_itens;
CREATE POLICY "Usuários podem criar itens no seu tenant"
  ON requisicao_itens FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Usuários podem atualizar itens do seu tenant" ON requisicao_itens;
CREATE POLICY "Usuários podem atualizar itens do seu tenant"
  ON requisicao_itens FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- HABILITAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisicao_itens ENABLE ROW LEVEL SECURITY;
```

### 3️⃣ Execute

1. Cole o script no SQL Editor
2. Clique em **RUN** (ou pressione `Ctrl+Enter`)
3. Aguarde a mensagem de sucesso

### 4️⃣ Teste

1. Volte para http://localhost:3000
2. Faça login
3. Acesse **Requisições** no menu
4. Clique em **Nova Requisição**
5. Preencha e envie

---

## ✅ Resultado Esperado

Após executar o script:
- ✅ Dashboard carrega normalmente
- ✅ Pode criar requisições
- ✅ Pode ver lista de requisições
- ✅ Pode aprovar/reprovar (se for ADMIN/GESTOR)
- ✅ Multi-tenant isolado funcionando

---

## ❌ Se der erro

Se aparecer erro ao executar o script, me envie a mensagem de erro completa.

Erros comuns:
- `syntax error`: Verifique se copiou o script completo
- `relation does not exist`: A tabela não existe, precisa rodar as migrations primeiro
- `role does not exist`: Problema com roles do Supabase (raro)

---

**Tempo estimado**: 2 minutos ⏱️
