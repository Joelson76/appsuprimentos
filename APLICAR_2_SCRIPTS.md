# 🚀 APLICAR ESTES 2 SCRIPTS NO SUPABASE

## Passo 1: Adicionar Campos Faltantes

Execute **PRIMEIRO** este script para adicionar os campos `produto` e `observacao`:

```sql
-- ==========================================
-- Script 1: ADD_OBSERVACAO_CAMPO.sql
-- ==========================================
```

📁 Arquivo: `supabase/ADD_OBSERVACAO_CAMPO.sql`

Este script:
- ✅ Adiciona campo `observacao` (se não existir)
- ✅ Adiciona campo `produto` (se não existir)  
- ✅ Lista todos os campos da tabela para conferir
- ✅ **NÃO deleta nada, só ADICIONA**

---

## Passo 2: Configurar Permissões e RLS

Execute **DEPOIS** este script para configurar as políticas de segurança:

```sql
-- ==========================================
-- Script 2: APLICAR_ESTE.sql
-- ==========================================
```

📁 Arquivo: `supabase/APLICAR_ESTE.sql`

Este script:
- ✅ Dá permissões para usuários autenticados
- ✅ Cria políticas RLS (segurança multi-tenant)
- ✅ **NÃO deleta dados, só configura segurança**

---

## 📋 Como Executar no Supabase

### 1️⃣ Abra o SQL Editor
- Acesse: https://supabase.com
- Entre no seu projeto
- Clique em **SQL Editor** → **New Query**

### 2️⃣ Execute Script 1
- Copie TODO o conteúdo de `supabase/ADD_OBSERVACAO_CAMPO.sql`
- Cole no editor
- Clique em **RUN** (Ctrl+Enter)
- Veja as mensagens:
  ```
  ✅ Campo observacao adicionado com sucesso
  ✅ Campo produto adicionado com sucesso
  ```

### 3️⃣ Execute Script 2
- Abra uma **New Query**
- Copie TODO o conteúdo de `supabase/APLICAR_ESTE.sql`
- Cole no editor
- Clique em **RUN**
- Veja as mensagens:
  ```
  ✅ Profiles: 2 política(s)
  ✅ Tenants: 1 política(s)
  ✅ Requisições: 3 política(s)
  ✅ Itens: 4 política(s)
  🎉 SETUP COMPLETO!
  ```

---

## ✅ Campos Finais da Tabela

Após executar, `itens_requisicao` terá:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | UUID | Identificador único |
| requisicao_id | UUID | Referência à requisição |
| **produto** | TEXT | Nome do produto/serviço |
| **descricao** | TEXT | Descrição detalhada (obrigatório) |
| quantidade | NUMERIC | Quantidade |
| unidade | TEXT | Unidade (UN, KG, L, etc) |
| valor_estimado | NUMERIC | Valor estimado em R$ |
| **observacao** | TEXT | Observações adicionais |
| categoria_id | UUID | Categoria (opcional) |

---

## 🎉 Resultado Final

Após executar os 2 scripts:
- ✅ Dashboard funciona
- ✅ Criar requisições com todos os campos
- ✅ Ver detalhes completos
- ✅ Aprovar/Reprovar requisições
- ✅ Multi-tenant isolado
- ✅ Nenhum dado foi deletado

---

## ❓ Dúvidas?

Se algum script der erro, me envie a mensagem de erro completa!
