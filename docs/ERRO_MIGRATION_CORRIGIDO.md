# ❌ Erro na Migration - CORRIGIDO

## 🐛 Erro Original

```
Error: Failed to run sql query: 
ERROR: 42P01: relation "estoque" does not exist
```

**Arquivo:** `supabase/migrations/20260629000000_fix_rls_security.sql`  
**Linha:** 251-253

---

## 🔍 Causa do Erro

A migration tentava criar policy na tabela `estoque`, mas essa tabela **não existe** no banco atual:

```sql
-- ❌ ERRO: Tentava criar policy sem verificar se tabela existe
DROP POLICY IF EXISTS "estoque_tenant" ON estoque;
CREATE POLICY "estoque_tenant"
  ON estoque  -- ⚠️ Tabela não existe!
  FOR ALL
  USING (tenant_id = ...)
```

**Por quê?** A tabela `estoque` provavelmente está em uma migration futura que ainda não foi aplicada, ou foi removida em alguma refatoração.

---

## ✅ Correção Aplicada

Criei uma **versão SAFE** da migration que verifica se a tabela existe antes de criar policies:

```sql
-- ✅ CORRIGIDO: Verifica se tabela existe
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'estoque') THEN
    DROP POLICY IF EXISTS "estoque_tenant" ON estoque;
    CREATE POLICY "estoque_tenant"
      ON estoque
      FOR ALL
      USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))
      WITH CHECK (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
    RAISE NOTICE '✅ Policy criada: estoque';
  ELSE
    RAISE NOTICE '⚠️  Tabela estoque não existe - pulando';
  END IF;
END $$;
```

---

## 🔧 Tabelas Verificadas

A migration agora verifica a existência de TODAS as tabelas antes de criar policies:

```sql
-- Verificação aplicada em:
✅ requisicoes   (DO $$ ... IF EXISTS)
✅ pedidos       (DO $$ ... IF EXISTS)
✅ ordens_compra (DO $$ ... IF EXISTS)
✅ produtos      (DO $$ ... IF EXISTS)
✅ estoque       (DO $$ ... IF EXISTS) ⭐ CORRIGIDO
✅ tenants       (DO $$ ... IF EXISTS)
✅ itens_cotacao (DO $$ ... IF EXISTS)
```

**Tabelas obrigatórias (sem verificação):**
- `profiles` - Sempre existe (criada no setup inicial)
- `cotacoes` - Sempre existe (core do sistema)
- `fornecedores` - Sempre existe (core do sistema)

---

## 📊 Status das Tabelas no Banco Atual

Verificação automática no final da migration:

```sql
DO $$
DECLARE
  v_table TEXT;
  v_tables TEXT[] := ARRAY[
    'profiles', 'tenants', 'requisicoes', 'cotacoes', 'pedidos',
    'ordens_compra', 'produtos', 'fornecedores'
  ];
  v_exists BOOLEAN;
  v_has_rls BOOLEAN;
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    -- Verificar se existe
    SELECT EXISTS (...) INTO v_exists;
    
    IF NOT v_exists THEN
      RAISE NOTICE '⚠️  Tabela não existe: %', v_table;
      CONTINUE;
    END IF;

    -- Verificar RLS
    IF NOT v_has_rls THEN
      RAISE WARNING '⚠️  RLS NÃO está ativo: %', v_table;
    ELSE
      RAISE NOTICE '✅ RLS ativo: %', v_table;
    END IF;
  END LOOP;
END $$;
```

**Output esperado:**
```
✅ RLS ativo: profiles
✅ RLS ativo: tenants
✅ RLS ativo: requisicoes
✅ RLS ativo: cotacoes
✅ RLS ativo: pedidos
✅ RLS ativo: ordens_compra
✅ RLS ativo: produtos
✅ RLS ativo: fornecedores
⚠️  Tabela estoque não existe - pulando (OK)
```

---

## 🎯 Resultado Final

### Arquivo Atualizado:
```
✅ supabase/migrations/20260629000000_fix_rls_security.sql
   (substituído pela versão SAFE)
```

### O Que Mudou:
1. ✅ Adicionado `IF EXISTS` para verificar tabelas
2. ✅ Mensagens de log para debug (`RAISE NOTICE`)
3. ✅ Verificação automática de RLS no final
4. ✅ Migration não quebra se tabela não existir

### Comportamento:
- **Tabela existe:** Cria policy normalmente
- **Tabela não existe:** Pula com aviso (não dá erro)

---

## 🧪 Como Testar Agora

```bash
# 1. Aplicar migration corrigida
supabase db push

# 2. Verificar output (deve mostrar):
# ✅ Policies criadas nas tabelas existentes
# ⚠️  Aviso sobre tabelas que não existem (normal)

# 3. Se tudo OK, testar funcionalidades:
npm run dev

# 4. Testar:
# - Login
# - Criar usuário
# - Link de fornecedor
```

---

## 🔄 Se Precisar Rollback

A migration antiga foi **substituída**, não deletada. Se precisar voltar:

```bash
# Não tem como voltar - migration foi substituída
# Mas você pode:

# 1. Dropar policies manualmente:
DROP POLICY IF EXISTS "profiles_self_access" ON profiles;
DROP POLICY IF EXISTS "cotacoes_access_secure" ON cotacoes;
# ... etc

# 2. Recriar policies antigas:
CREATE POLICY "profiles_tenant" ON profiles
  FOR ALL USING (tenant_id = ...);

CREATE POLICY "cotacoes_public_read" ON cotacoes
  FOR SELECT USING (true);  -- ⚠️ INSEGURO!
```

**Recomendação:** Não fazer rollback - correções melhoram segurança!

---

## 📝 Lições Aprendidas

### 1. **Sempre verificar existência de tabelas**
```sql
-- ❌ MAU:
CREATE POLICY "x" ON tabela_que_pode_nao_existir ...

-- ✅ BOM:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'tabela') THEN
    CREATE POLICY "x" ON tabela ...
  END IF;
END $$;
```

### 2. **Adicionar logs de debug**
```sql
RAISE NOTICE '✅ Policy criada: %', nome_tabela;
RAISE NOTICE '⚠️  Tabela não existe: %', nome_tabela;
```

### 3. **Verificar estado final**
```sql
-- Ao final da migration, verificar:
-- - Quais tabelas têm RLS ativo
-- - Quais policies foram criadas
-- - Quais tabelas não existem
```

---

## ✅ Checklist de Validação

Após aplicar migration corrigida:

- [x] Migration SQL corrigida
- [x] Verificação de existência de tabelas
- [x] Logs de debug adicionados
- [x] Verificação final de RLS
- [ ] **Testado localmente** ⚠️ FAZER AGORA
- [ ] Migration aplicada em dev/staging
- [ ] Funcionalidades testadas
- [ ] Pronto para produção

---

**Status:** ✅ CORRIGIDO  
**Pronto para:** TESTE LOCAL  
**Próximo passo:** `supabase db push` (local)
