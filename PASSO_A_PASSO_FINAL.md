# 🎯 PASSO A PASSO DEFINITIVO - SupriFlow

## ⚠️ PROBLEMA ATUAL

Você está tendo o erro:
```
ERROR: type "tipo_movimentacao" already exists
```

**Isso significa:** Você está tentando aplicar uma migration que já foi aplicada!

---

## ✅ SOLUÇÃO DEFINITIVA (Escolha UMA opção)

### 🔄 OPÇÃO 1: Recomeçar do Zero (RECOMENDADO)

**Use se:** Você não tem dados importantes ou quer garantir que tudo está correto

1. **No SQL Editor do Supabase:**

```sql
-- PASSO 1: Reset completo
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
```

2. **Agora aplique as migrations NA ORDEM (copie e cole cada uma):**

```sql
-- ✅ FASE 1
-- Copie TODO o arquivo: supabase/migrations/20250101000000_fase1_inicial.sql
-- Cole aqui e clique RUN
```

```sql
-- ✅ FASE 2
-- Copie TODO o arquivo: supabase/migrations/20250102000000_fase2_compras.sql
-- Cole aqui e clique RUN
```

```sql
-- ✅ FASE 3
-- Copie TODO o arquivo: supabase/migrations/20250103000000_fase3_fiscal_contratos.sql
-- Cole aqui e clique RUN
```

```sql
-- ✅ FASE 4
-- Copie TODO o arquivo: supabase/migrations/20250104000000_fase4_estoque_dashboard.sql
-- Cole aqui e clique RUN
```

```sql
-- ✅ FASE 5
-- Copie TODO o arquivo: supabase/migrations/20250105000000_fase5_saas.sql
-- Cole aqui e clique RUN
```

---

### 🎯 OPÇÃO 2: Continuar de onde parou

**Use se:** Você quer manter os dados de teste que já tem

1. **Descubra onde você está:**

```sql
SELECT COUNT(*) as total_tabelas
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

**Interpretação:**
- **3 tabelas** → Você tem Fase 1 ✅ | Falta: 2, 3, 4, 5
- **14 tabelas** → Você tem Fase 1, 2 ✅ | Falta: 3, 4, 5
- **18 tabelas** → Você tem Fase 1, 2, 3 ✅ | Falta: 4, 5
- **20 tabelas** → Você tem Fase 1, 2, 3, 4 ✅ | Falta: 5
- **24 tabelas** → ✅ **COMPLETO! Não aplique mais nada!**

2. **Aplique APENAS as que faltam**

**Exemplo:** Se você tem 18 tabelas, aplique APENAS Fase 4 e 5.

---

## 📋 VERIFICAÇÃO FINAL

Depois de aplicar tudo, execute:

```sql
-- 1. Contar tabelas (deve ser 24)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 2. Ver planos (deve mostrar 3)
SELECT nome, preco_centavos/100.0 as preco_reais FROM planos;

-- 3. Ver jobs (deve mostrar 4)
SELECT jobname FROM cron.job WHERE jobname LIKE '%-%';

-- 4. Ver enums (deve mostrar 14)
SELECT typname FROM pg_type 
WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND typtype = 'e'
ORDER BY typname;
```

**Resultado esperado:**
- ✅ 24 tabelas
- ✅ 3 planos
- ✅ 4 jobs
- ✅ 14 enums

---

## 🔧 Depois das Migrations

### 1. Configurar Auth Hook

**Authentication → Hooks → Add new hook**
- Type: Custom Access Token
- Schema: public
- Function: `custom_access_token_hook`
- **Save**

### 2. Criar Bucket Storage

**Storage → New bucket**
- Name: `documentos`
- Public: OFF
- **Create**

Depois execute as policies:

```sql
CREATE POLICY "documentos_tenant_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );

CREATE POLICY "documentos_tenant_write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );

CREATE POLICY "documentos_tenant_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );
```

---

## 🚀 Testar o Sistema

```bash
npm run dev
```

Acesse: **http://localhost:3000**

1. **Cadastre uma empresa**
2. **Faça login**
3. **Veja o dashboard**

---

## ❓ FAQ

### P: Já apliquei uma migration, posso aplicar de novo?
**R:** NÃO! Isso causa o erro "already exists". Use a Opção 1 (reset) se quiser reaplica.

### P: Como sei qual fase já está instalada?
**R:** Execute a query de contagem de tabelas na Opção 2.

### P: Posso pular uma fase?
**R:** NÃO! As fases dependem umas das outras. Aplique SEMPRE na ordem 1→2→3→4→5.

### P: O que fazer se der erro durante uma migration?
**R:** Use a Opção 1 (reset) e recomece do zero.

---

## ✅ RESUMO

**Caminho mais rápido e seguro:**

1. ✅ **Execute o reset** (3 linhas SQL)
2. ✅ **Aplique as 5 migrations** (copiar e colar)
3. ✅ **Configure Auth Hook** (1 clique)
4. ✅ **Crie o bucket** (2 cliques + 3 policies)
5. ✅ **Rode o sistema** (`npm run dev`)

**Tempo total: ~15 minutos**

---

**Boa sorte! 🎉**
