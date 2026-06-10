# 🚀 Guia Rápido - Deploy do SupriFlow

## ⚡ Passo a Passo Completo

### 1️⃣ Configurar Supabase (5 minutos)

#### A. Criar Projeto
1. Acesse https://supabase.com
2. Clique em **"New Project"**
3. Preencha:
   - Nome: `supriflow`
   - Database Password: (anote bem!)
   - Region: South America (São Paulo)
4. Aguarde ~2 minutos

#### B. Copiar Credenciais
1. Vá em **Settings → API**
2. Copie e cole no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

---

### 2️⃣ Aplicar Migrations (10 minutos)

#### No SQL Editor do Supabase:

1. Vá em **SQL Editor** (menu lateral)
2. Clique em **"+ New query"**

**Aplique NA ORDEM:**

#### ✅ Fase 1 - Fundação
```sql
-- Copie TODO o conteúdo de:
-- supabase/migrations/20250101000000_fase1_inicial.sql

-- Cole aqui e clique RUN
```

#### ✅ Fase 2 - Compras
```sql
-- Copie TODO o conteúdo de:
-- supabase/migrations/20250102000000_fase2_compras.sql

-- Cole aqui e clique RUN
```

#### ✅ Fase 3 - Fiscal
```sql
-- Copie TODO o conteúdo de:
-- supabase/migrations/20250103000000_fase3_fiscal_contratos.sql

-- Cole aqui e clique RUN
```

#### ✅ Fase 4 - Estoque
```sql
-- Copie TODO o conteúdo de:
-- supabase/migrations/20250104000000_fase4_estoque_dashboard.sql

-- Cole aqui e clique RUN
```

#### ✅ Fase 5 - SaaS
```sql
-- Copie TODO o conteúdo de:
-- supabase/migrations/20250105000000_fase5_saas.sql

-- Cole aqui e clique RUN
```

---

### 3️⃣ Configurar Auth Hook (2 minutos)

1. Vá em **Authentication → Hooks**
2. Clique em **"Add a new hook"**
3. Selecione: **Custom Access Token**
4. Configure:
   - **Type:** SQL
   - **Schema:** public
   - **Function:** custom_access_token_hook
5. Clique **Save**

---

### 4️⃣ Criar Bucket Storage (3 minutos)

1. Vá em **Storage**
2. Clique **"New bucket"**
3. Nome: `documentos`
4. **Public:** OFF (privado)
5. Clique **Create bucket**

#### Adicionar Policies no SQL Editor:

```sql
-- Policy de leitura
CREATE POLICY "documentos_tenant_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );

-- Policy de escrita
CREATE POLICY "documentos_tenant_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );

-- Policy de atualização
CREATE POLICY "documentos_tenant_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );
```

---

### 5️⃣ Verificar Jobs pg_cron (1 minuto)

1. Vá em **Database → Cron Jobs**
2. Deve ver 5 jobs:
   - alertas-contratos-diarios
   - alerta-estoque-minimo
   - verificar-trial-diario
   - reset-pos-mensais
   - (1 job vem do Supabase)

---

### 6️⃣ Testar o Sistema (5 minutos)

#### A. Rodar localmente:

```bash
npm run dev
```

#### B. Acessar:
```
http://localhost:3000
```

#### C. Cadastrar primeira empresa:
1. Clique em **"Cadastre-se"**
2. Preencha:
   - Razão Social: `Empresa Teste LTDA`
   - CNPJ: `12.345.678/0001-90` (qualquer um válido)
   - Nome: Seu nome
   - E-mail: seu@email.com
   - Senha: (mínimo 6 caracteres)
   - Plano: **Básico**
3. Clique **"Criar Conta"**

#### D. Fazer Login:
1. Use o e-mail e senha cadastrados
2. Você será redirecionado para o dashboard

---

## ✅ Checklist de Verificação

Marque conforme completa:

- [ ] Projeto Supabase criado
- [ ] `.env.local` configurado
- [ ] Migration Fase 1 aplicada (3 tabelas criadas)
- [ ] Migration Fase 2 aplicada (11 tabelas criadas)
- [ ] Migration Fase 3 aplicada (4 tabelas criadas)
- [ ] Migration Fase 4 aplicada (2 tabelas + 3 views criadas)
- [ ] Migration Fase 5 aplicada (4 tabelas criadas + seed de planos)
- [ ] Auth Hook configurado
- [ ] Bucket `documentos` criado com policies
- [ ] 5 jobs pg_cron ativos
- [ ] Sistema rodando em `localhost:3000`
- [ ] Cadastro de empresa funcionando
- [ ] Login funcionando
- [ ] Dashboard carregando

---

## 🔍 Verificar se está tudo OK

### No SQL Editor, execute:

```sql
-- Contar tabelas criadas (deve retornar 24)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Ver planos (deve mostrar 3: Básico, Profissional, Enterprise)
SELECT nome, preco_centavos/100.0 as preco_reais 
FROM planos 
ORDER BY ordem;

-- Ver jobs ativos (deve mostrar 5)
SELECT jobname, schedule 
FROM cron.job 
WHERE jobname LIKE '%-%';

-- Ver bucket criado
SELECT name, public 
FROM storage.buckets;
```

**Resultados esperados:**
- 24 tabelas
- 3 planos
- 5 jobs (4 nossos + 1 do Supabase)
- 1 bucket (documentos)

---

## 🐛 Troubleshooting

### ❌ Erro: "relation does not exist"
**Solução:** Migration não foi aplicada. Volte ao passo 2.

### ❌ Erro: "JWT does not contain expected claim"
**Solução:** Auth Hook não foi configurado. Volte ao passo 3.

### ❌ Erro: "bucket not found"
**Solução:** Bucket não foi criado. Volte ao passo 4.

### ❌ Login não funciona
**Solução:** 
1. Verifique se o Auth Hook está ativo
2. No Supabase, vá em Authentication → Users
3. Veja se o usuário foi criado

### ❌ Redirect loop infinito
**Solução:**
1. Limpe cookies do navegador
2. Reinicie o servidor (`npm run dev`)

---

## 🎯 Próximos Passos

Após tudo funcionando:

1. **Testar funcionalidades:**
   - Cadastrar fornecedor
   - Criar requisição
   - Criar pedido (PO)
   - Testar estoque

2. **Deploy em produção:**
   - Vercel (frontend)
   - Supabase (já está pronto)
   - Configurar domínio

3. **Configurar APIs externas:**
   - Asaas (pagamentos)
   - Resend (e-mails)

---

## 📞 Suporte

Se algo der errado:
1. Verifique os logs do Supabase (Database → Logs)
2. Verifique console do navegador (F12)
3. Verifique terminal do Next.js

---

**Tempo total estimado: ~25 minutos** ⏱️

**Boa sorte! 🚀**
