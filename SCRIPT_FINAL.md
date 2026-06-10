# 🎯 SCRIPT FINAL - Execute ESTE no Supabase

## ⚠️ IMPORTANTE:
- ✅ Este script **NÃO deleta nenhum dado**
- ✅ Este script **NÃO remove nenhum campo**
- ✅ Este script **SÓ adiciona permissões e políticas de segurança**

---

## 📋 Passos:

### 1️⃣ (OPCIONAL) Adicionar campos produto e observacao

Se você quer os campos `produto` e `observacao` na tabela `itens_requisicao`:

📁 **Execute**: `supabase/ADD_OBSERVACAO_CAMPO.sql`

Este script **SÓ ADICIONA** campos, nunca remove.

---

### 2️⃣ Configurar TODAS as permissões

📁 **Execute**: `supabase/FIX_PERMISSOES_COMPLETO.sql`

Este script resolve o erro:
```
permission denied for table sequencias_numeracao
```

E configura permissões para TODAS as tabelas:
- ✅ profiles
- ✅ tenants
- ✅ requisicoes
- ✅ itens_requisicao
- ✅ sequencias_numeracao ⭐ (essa estava faltando!)
- ✅ fornecedores
- ✅ categorias
- ✅ centros_custo

---

## 🚀 Como Executar:

### 1. Abra o Supabase SQL Editor
👉 https://supabase.com → Seu projeto → **SQL Editor** → **New Query**

### 2. (Opcional) Adicionar campos
- Copie TODO o conteúdo de `supabase/ADD_OBSERVACAO_CAMPO.sql`
- Cole e execute
- Veja:
  ```
  ✅ Campo observacao adicionado com sucesso
  ✅ Campo produto adicionado com sucesso
  ```

### 3. Configurar permissões
- Abra **New Query**
- Copie TODO o conteúdo de `supabase/FIX_PERMISSOES_COMPLETO.sql`
- Cole e execute
- Veja:
  ```
  ✅ profiles: 2 política(s)
  ✅ tenants: 1 política(s)
  ✅ requisicoes: 4 política(s)
  ✅ itens_requisicao: 4 política(s)
  ✅ sequencias_numeracao: 1 política(s)
  🎉 SETUP COMPLETO!
  ```

---

## ✅ Resultado:

Após executar:
- ✅ Criar requisições funciona
- ✅ Numeração automática (REQ-2025-0001) funciona
- ✅ Dashboard carrega
- ✅ Aprovação funciona
- ✅ Multi-tenant isolado
- ✅ **Zero erros de permissão**

---

## 🛡️ Garantia:

**NENHUM destes comandos está no script:**
- ❌ `DROP COLUMN`
- ❌ `DELETE FROM`
- ❌ `TRUNCATE`
- ❌ `DROP TABLE`

**Seus dados estão 100% seguros!**
