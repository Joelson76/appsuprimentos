# Sistema de Filiais (Multi-CNPJ)

## Visão Geral

O SupriFlow suporta **múltiplas filiais por empresa**, permitindo que cada tenant gerencie operações com diferentes CNPJs (matriz + filiais).

## Estrutura

### Tabela `filiais`

Armazena as filiais de cada tenant:

```sql
CREATE TABLE filiais (
  id            UUID PRIMARY KEY,
  tenant_id     UUID REFERENCES tenants(id),
  cnpj          TEXT UNIQUE,        -- CNPJ de 14 dígitos
  nome          TEXT,               -- Razão social
  nome_fantasia TEXT,               -- Nome comercial (opcional)
  is_matriz     BOOLEAN,            -- Identifica a matriz
  ativa         BOOLEAN,            -- Status da filial
  -- Endereço completo
  cep, logradouro, numero, complemento, bairro, cidade, estado
)
```

### Regras de Negócio

1. **Cada tenant tem exatamente 1 matriz** (`is_matriz = true`)
2. **CNPJ único** no sistema (constraint `UNIQUE`)
3. **Apenas 1 matriz por tenant** (constraint `uq_tenant_matriz`)
4. **Isolamento por RLS**: filiais visíveis apenas para o tenant dono

### Tabelas com `filial_id`

As seguintes tabelas suportam filiais:

- `profiles` - usuários podem estar vinculados a uma filial específica
- `requisicoes` - requisições originam de uma filial
- `cotacoes` - cotações vinculadas a filial
- `ordens_compra` - pedidos de uma filial específica
- `fornecedores` - fornecedores podem ser específicos de uma filial

## Como Usar

### 1. Aplicar Migration

Execute no Supabase SQL Editor:

```bash
supabase/migrations/20260619000001_add_filiais.sql
```

A migration irá:
- Criar tabela `filiais`
- Adicionar coluna `filial_id` nas tabelas principais
- Migrar dados existentes (criar matriz para cada tenant)
- Configurar RLS e validações

### 2. Cadastrar Filiais

Interface web: `/configuracoes/filiais`

- Lista todas as filiais do tenant
- Botão "Nova Filial" para cadastrar
- Validação automática de CNPJ
- Integração com ViaCEP para buscar endereço

### 3. Usar Seletor de Filial em Formulários

```tsx
import { SelectFilial } from '@/components/filiais/select-filial'

function MeuFormulario() {
  const [filialId, setFilialId] = useState('')

  return (
    <SelectFilial
      value={filialId}
      onChange={setFilialId}
      required
      label="Selecione a Filial"
    />
  )
}
```

### 4. Filtrar por Filial em Queries

```typescript
// Buscar requisições de uma filial específica
const { data } = await supabase
  .from('requisicoes')
  .select('*')
  .eq('filial_id', filialId)

// Buscar usuários de uma filial
const { data: usuarios } = await supabase
  .from('profiles')
  .select('*')
  .eq('filial_id', filialId)
```

### 5. Dashboard por Filial

```sql
-- KPIs por filial
SELECT
  f.nome as filial,
  COUNT(DISTINCT r.id) as total_requisicoes,
  COUNT(DISTINCT oc.id) as total_pedidos,
  COUNT(DISTINCT p.id) as total_usuarios
FROM filiais f
LEFT JOIN requisicoes r ON r.filial_id = f.id
LEFT JOIN ordens_compra oc ON oc.filial_id = f.id
LEFT JOIN profiles p ON p.filial_id = f.id
WHERE f.tenant_id = :tenant_id
GROUP BY f.id, f.nome
```

## Validações

### CNPJ

Função `validar_cnpj()` garante:
- 14 dígitos numéricos
- Formato válido

Trigger automático valida CNPJ antes de inserir/atualizar.

### UNIQUE Constraints

- `cnpj` - único no sistema (não pode duplicar)
- `uq_tenant_matriz` - apenas 1 matriz por tenant

## View Auxiliar

```sql
vw_filiais_completo
```

Retorna filiais com estatísticas agregadas:
- Total de usuários
- Total de requisições
- Total de pedidos

## Migration de Dados Existentes

A migration `20260619000001_add_filiais.sql` automaticamente:

1. Cria filial "Matriz" para cada tenant existente usando o CNPJ do tenant
2. Vincula todos os registros existentes à matriz
3. Define `filial_id` para todos profiles, requisições, cotações, pedidos e fornecedores

**Não há perda de dados na migração.**

## Exemplo de Uso Completo

### Cadastrar Filial

```typescript
const { error } = await supabase.from('filiais').insert({
  tenant_id: userTenantId,
  cnpj: '12345678000195',
  nome: 'Empresa LTDA - Filial SP',
  nome_fantasia: 'Filial São Paulo',
  is_matriz: false,
  ativa: true,
  cidade: 'São Paulo',
  estado: 'SP'
})
```

### Criar Requisição em Filial

```typescript
const { error } = await supabase.from('requisicoes').insert({
  tenant_id: userTenantId,
  filial_id: filialId,  // <-- vincular à filial
  solicitante_id: userId,
  // ... outros campos
})
```

### Filtrar Dashboard por Filial

```typescript
const { data: requisicoes } = await supabase
  .from('requisicoes')
  .select('*, filial:filiais(nome, cnpj)')
  .eq('filial_id', filialSelecionada)
  .gte('criado_em', inicioMes)
```

## Rotas

- `/configuracoes/filiais` - Lista de filiais
- `/configuracoes/filiais/nova` - Cadastrar nova filial
- `/configuracoes/filiais/[id]` - Detalhes da filial (TODO)

## Próximos Passos

- [ ] Adicionar filtro por filial no dashboard principal
- [ ] Relatórios consolidados (todas filiais) vs por filial
- [ ] Transferência de requisições/pedidos entre filiais
- [ ] Permissões por filial (usuário restrito a 1 filial)
- [ ] Validação completa de dígitos verificadores do CNPJ
