# Como Aplicar a Migration de Correção

## Problema
Links de cotação para fornecedores retornam erro:
```
"permission denied for table cotacoes"
```

## Solução
A migration `20260622000002_fix_public_cotacao_access.sql` adiciona policies RLS que permitem acesso público de leitura às tabelas `cotacoes` e `fornecedores`.

## Como Aplicar no Supabase

### Opção 1: Via Supabase Dashboard (RECOMENDADO)

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo completo do arquivo:
   ```
   supabase/migrations/20260622000002_fix_public_cotacao_access.sql
   ```
6. Clique em **Run** (ou Ctrl+Enter)
7. ✅ Verifique se apareceu "Success"

### Opção 2: Via Supabase CLI

Se você tem o Supabase CLI instalado:

```bash
# No diretório do projeto
supabase db push
```

## Verificação

Após aplicar, teste:

1. Acesse qualquer link de cotação sem estar logado
2. Deve funcionar normalmente
3. Ou use a API de debug:
   ```
   https://appsuprimentos.vercel.app/api/debug-token?token=SEU_TOKEN_AQUI
   ```

## O Que a Migration Faz

1. **Cria policy em `cotacoes`:**
   - Permite SELECT público (leitura sem autenticação)
   - Escrita ainda protegida pelo RLS original

2. **Cria policy em `fornecedores`:**
   - Permite SELECT público (para mostrar nome na página de cotação)
   - Escrita ainda protegida pelo RLS original

3. **Não mexe em `itens_cotacao`:**
   - Já não tem RLS (conforme design original)
   - Acesso controlado via token_resposta

## Segurança

✅ **Seguro** - as policies só permitem LEITURA pública  
✅ **Isolamento mantido** - escrita ainda requer autenticação e tenant_id  
✅ **Dados sensíveis protegidos** - valores/propostas não são públicos até o fornecedor preencher  

## Rollback (se necessário)

Para reverter (não recomendado):

```sql
DROP POLICY IF EXISTS "cotacoes_public_read" ON cotacoes;
DROP POLICY IF EXISTS "fornecedores_public_read" ON fornecedores;
```
