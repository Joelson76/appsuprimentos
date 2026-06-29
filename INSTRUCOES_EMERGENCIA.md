# 🚨 INSTRUÇÕES DE EMERGÊNCIA

## Problema

Sistema trava no login MESMO APÓS ROLLBACK do código.

**Causa:** RLS está ativo no Supabase mas as policies estão quebradas.

---

## ✅ SOLUÇÃO IMEDIATA (5 minutos)

### Passo 1: Abrir Supabase

```
1. https://supabase.com/dashboard
2. Selecionar projeto "appsuprimentos"
3. Clicar em "SQL Editor" (ícone de terminal)
```

### Passo 2: Rodar SQL

Copiar e colar este comando:

```sql
-- Desabilitar RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

### Passo 3: Clicar "Run" (ou Ctrl+Enter)

Deve aparecer: **Success**

### Passo 4: Testar Login

```
1. Abrir site (nova aba anônima)
2. Fazer login
3. Deve funcionar ✅
```

---

## 📋 Passo a Passo Visual

### 1. Supabase Dashboard

```
https://supabase.com/dashboard
  ↓
Selecionar seu projeto
  ↓
SQL Editor (menu lateral esquerdo)
```

### 2. No SQL Editor

```
┌─────────────────────────────────────┐
│ SQL Editor                     Run │
├─────────────────────────────────────┤
│                                     │
│ ALTER TABLE profiles                │
│ DISABLE ROW LEVEL SECURITY;         │
│                                     │
│                            [Run] ← CLICAR
└─────────────────────────────────────┘
```

### 3. Resultado Esperado

```
✅ Success. No rows returned

Query executada com sucesso!
```

---

## ⚠️ O Que Este Fix Faz

**Remove temporariamente o RLS da tabela profiles**

**Efeito:**
- ✅ Login funciona imediatamente
- ✅ Sistema volta ao normal
- ⚠️ Profiles não têm isolamento (OK temporariamente)

**É seguro?**
- ✅ Sim para uso imediato
- ⚠️ Não é ideal para produção de longo prazo
- 📝 Depois precisamos reativar RLS com policies corretas

---

## 🔍 Verificar se Funcionou

### Query de Verificação:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
```

**Resultado esperado:**
```
tablename | rowsecurity
----------+-------------
profiles  | false       ← RLS desabilitado ✅
```

---

## 📊 Depois de Funcionar

Quando o login estiver OK e quiser reativar segurança:

### 1. Reativar RLS

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### 2. Criar Policies Corretas

```sql
-- Self-access: usuário lê seu próprio profile
CREATE POLICY "profiles_self_access"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Tenant isolation: usuário do mesmo tenant
CREATE POLICY "profiles_tenant"
  ON profiles
  FOR SELECT
  USING (
    tenant_id = (
      (auth.jwt()->'app_metadata'->>'tenant_id')::UUID
    )
  );
```

### 3. Testar Novamente

```
- Fazer login
- Deve continuar funcionando ✅
```

---

## 🎯 Resumo Rápido

**AGORA:**
```
1. Supabase Dashboard
2. SQL Editor
3. Colar: ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
4. Run
5. Testar login
```

**2 MINUTOS DE TRABALHO → SISTEMA FUNCIONA** ✅

---

## 💬 Se Der Erro

### Erro: "permission denied to alter table"

**Solução:** Usar usuário postgres (admin)
```
Supabase → Settings → Database
Copiar: Database Password
Conectar como postgres
```

### Erro: "table does not exist"

**Solução:** Nome da tabela está correto
```sql
-- Verificar nome da tabela
SELECT tablename 
FROM pg_tables 
WHERE tablename LIKE '%profile%';
```

---

## 📞 Ordem de Execução

```
1. SQL no Supabase (2 min) ← FAZER PRIMEIRO
2. Testar login (1 min)
3. Confirmar que funciona
4. Usar sistema normalmente
5. Depois: reativar RLS (quando quiser)
```

---

**PRIORIDADE MÁXIMA: Rodar o SQL no Supabase AGORA** 🚨

**Arquivo SQL pronto:** `FIX_EMERGENCIAL_RLS.sql`
