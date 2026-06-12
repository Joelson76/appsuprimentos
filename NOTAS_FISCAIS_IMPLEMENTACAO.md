# 📄 Módulo de Notas Fiscais - Documentação

**Data:** 12/06/2026  
**Status:** ✅ Implementado

## 📋 Funcionalidades Implementadas

### 1. **Registro de NF-e**
- ✅ Upload de XML da NF-e
- ✅ Parser automático de dados do XML
- ✅ Cadastro manual de NF-e
- ✅ Vinculação com Pedido de Compra
- ✅ Armazenamento do XML no Supabase Storage

### 2. **Listagem de Notas Fiscais**
- ✅ Listagem com paginação
- ✅ Filtros por status
- ✅ KPIs no topo (Total, Valor, Conferidas, Divergentes)
- ✅ Badge de status colorido
- ✅ Indicador de divergências

### 3. **Detalhes da Nota Fiscal**
- ✅ Visualização completa dos dados da NF-e
- ✅ Comparação com Pedido de Compra
- ✅ Exibição de divergências
- ✅ Timeline de eventos
- ✅ Download do XML

### 4. **Conferência Automática (3-Way Matching)**
- ✅ Comparação NF vs Pedido (valores)
- ✅ Comparação NF vs Recebimento (quantidades)
- ✅ Identificação automática de divergências
- ✅ Classificação de severidade (ALTA/MÉDIA/BAIXA)

### 5. **Aprovação/Reprovação**
- ✅ Aprovar NF-e conferida
- ✅ Reprovar com motivo
- ✅ Workflow de status

## 🔄 Fluxo de Estados

```
PENDENTE → CONFERIDA → APROVADA
    ↓
DIVERGENTE → (correção) → CONFERIDA → APROVADA
    ↓
DEVOLVIDA
```

### Estados:
- **PENDENTE**: NF-e registrada, aguardando conferência
- **CONFERIDA**: Conferência automática OK, aguardando aprovação
- **APROVADA**: NF-e aprovada para pagamento
- **DIVERGENTE**: Divergências identificadas (alto impacto)
- **DEVOLVIDA**: NF-e rejeitada pelo usuário

## 📊 3-Way Matching

O sistema realiza conferência automática comparando:

### 1. NF-e vs Pedido de Compra
- ✅ Valor total
- ✅ Fornecedor (CNPJ)
- ✅ Número do pedido referenciado

### 2. NF-e vs Recebimento
- ✅ Quantidades recebidas
- ✅ Divergências de quantidade
- ✅ Data de recebimento

### 3. Classificação de Divergências

**Alta Severidade** (status → DIVERGENTE):
- Diferença de valor > 5%
- Produtos diferentes
- CNPJ diferente

**Média Severidade** (status → CONFERIDA com alerta):
- Diferença de quantidade
- Diferença de valor < 5%

**Baixa Severidade** (status → CONFERIDA):
- Diferenças mínimas (< R$ 0,01)
- Arredondamentos

## 📁 Estrutura de Arquivos

```
app/
├── (dashboard)/
│   └── notas-fiscais/
│       ├── page.tsx                    # Listagem
│       └── [id]/
│           └── page.tsx                # Detalhes
├── api/
│   └── notas-fiscais/
│       └── conferir/
│           └── route.ts                # API de conferência

components/
└── notas-fiscais/
    ├── processar-nfe-dialog.tsx        # Modal de registro
    ├── aprovar-nf-button.tsx           # Botão aprovar
    ├── reprovar-nf-button.tsx          # Botão reprovar
    └── conferir-nf-button.tsx          # Botão conferir

supabase/
└── migrations/
    ├── 20250103000000_fase3_fiscal_contratos.sql   # Tabela
    └── 20260612000000_storage_documentos.sql       # Storage
```

## 🗄️ Estrutura de Dados

### Tabela: `notas_fiscais`

```sql
CREATE TABLE notas_fiscais (
  id              UUID PRIMARY KEY,
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  pedido_id       UUID NOT NULL REFERENCES pedidos(id),
  recebimento_id  UUID REFERENCES recebimentos(id),
  
  -- Dados da NF-e
  numero          TEXT NOT NULL,
  serie           TEXT,
  chave_acesso    TEXT,
  emissao         DATE NOT NULL,
  valor_total     NUMERIC(15,2) NOT NULL,
  
  -- Controle
  status          status_nf NOT NULL DEFAULT 'PENDENTE',
  divergencias    JSONB,
  
  -- Arquivos
  xml_path        TEXT,
  pdf_path        TEXT,
  
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### ENUM: `status_nf`
```sql
CREATE TYPE status_nf AS ENUM (
  'PENDENTE',
  'CONFERIDA',
  'APROVADA',
  'DIVERGENTE',
  'DEVOLVIDA'
);
```

### Campo: `divergencias` (JSONB)

Estrutura:
```json
[
  {
    "tipo": "VALOR_TOTAL",
    "severidade": "ALTA",
    "descricao": "Divergência de valor: NF R$ 1500.00 vs PO R$ 1200.00",
    "diferenca": 300.00
  },
  {
    "tipo": "QUANTIDADE_RECEBIDA",
    "severidade": "MEDIA",
    "descricao": "2 item(ns) com divergência de quantidade",
    "itens": [
      {
        "descricao": "Produto X",
        "pedido": 10,
        "recebido": 8
      }
    ]
  }
]
```

## 🧪 Como Testar

### 1. Preparação
```bash
# Rodar migração de storage
# (executar SQL em supabase/migrations/20260612000000_storage_documentos.sql)

# Iniciar servidor
npm run dev
```

### 2. Testar Fluxo Completo

#### A. Criar Pedido de Compra
```bash
# 1. Criar requisição
http://localhost:3000/requisicoes/nova

# 2. Aprovar requisição

# 3. Criar cotação

# 4. Fornecedor responde

# 5. Marcar vencedor e gerar pedido

# 6. Enviar pedido para fornecedor
```

#### B. Registrar NF-e
```bash
# 1. Acessar Notas Fiscais
http://localhost:3000/notas-fiscais

# 2. Clicar em "Processar NF-e"

# 3. Opção A: Upload de XML
#    - Selecionar arquivo .xml da NF-e
#    - Dados preenchidos automaticamente
#    - Selecionar pedido vinculado

# 4. Opção B: Cadastro Manual
#    - Clicar em "Manual"
#    - Preencher todos os campos
#    - Selecionar pedido vinculado

# 5. Clicar em "Processar NF-e"
```

#### C. Conferir NF-e
```bash
# 1. Abrir detalhes da NF-e criada

# 2. Clicar em "Conferir Automaticamente"
#    - Sistema compara com pedido
#    - Identifica divergências
#    - Atualiza status

# 3. Analisar resultado:
#    - SEM divergências → Status: CONFERIDA
#    - COM divergências → Status: DIVERGENTE
```

#### D. Aprovar/Reprovar
```bash
# Se status = CONFERIDA:

# APROVAR:
# - Clicar em "Aprovar NF-e"
# - Confirmar
# - Status → APROVADA

# REPROVAR:
# - Clicar em "Reprovar"
# - Informar motivo
# - Confirmar
# - Status → DIVERGENTE
```

## 📤 Upload de XML

### Parser Automático

O sistema extrai automaticamente:
- ✅ Número da NF-e (`<nNF>`)
- ✅ Série (`<serie>`)
- ✅ Chave de Acesso (`<infNFe Id>`)
- ✅ Data de Emissão (`<dhEmi>`)
- ✅ Valor Total (`<vNF>`)

### Exemplo de XML (estrutura básica)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc>
  <NFe>
    <infNFe Id="NFe35230612345678000190550010001234561123456789">
      <ide>
        <nNF>123456</nNF>
        <serie>1</serie>
        <dhEmi>2023-06-12T10:30:00-03:00</dhEmi>
      </ide>
      <total>
        <ICMSTot>
          <vNF>1500.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>
```

## 🔒 Segurança

### RLS (Row Level Security)
```sql
CREATE POLICY "notas_fiscais_tenant"
ON notas_fiscais FOR ALL
USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));
```

### Storage Policies
- ✅ Upload apenas para usuários autenticados
- ✅ Download isolado por tenant
- ✅ Arquivos privados (não público)

## 📈 Métricas e KPIs

Dashboard exibe:
- **Total de NFs**: Quantidade total processada
- **Valor Total**: Soma de todas as NFs
- **Conferidas**: NFs aprovadas ou conferidas
- **Com Divergência**: NFs com status DIVERGENTE

## 🚀 Próximas Melhorias (Opcional)

### Fase 2 - Recursos Avançados
- [ ] Parser completo de itens do XML
- [ ] Download de DANFE (PDF)
- [ ] Integração com SEFAZ (consulta NF-e)
- [ ] OCR de DANFE físico
- [ ] Relatório de divergências
- [ ] Export para Excel/PDF
- [ ] Notificação de divergências via e-mail
- [ ] Histórico de alterações
- [ ] Comentários/observações
- [ ] Anexo de documentos adicionais

### Fase 3 - Integração Financeira
- [ ] Geração de contas a pagar
- [ ] Vencimentos e boletos
- [ ] Fluxo de caixa
- [ ] Integração com ERP

## 🐛 Troubleshooting

### Erro: "Bucket not found"
```sql
-- Executar migração de storage
-- supabase/migrations/20260612000000_storage_documentos.sql
```

### Erro: "XML inválido"
```
Solução: Verifique se o arquivo é um XML válido de NF-e
Tags obrigatórias: <NFe>, <infNFe>, <ide>, <total>
```

### Conferência não encontra divergências
```
Verificar:
1. Pedido está vinculado corretamente?
2. Valores estão formatados corretamente?
3. Recebimento foi registrado?
```

### Upload de XML falha
```
Verificar:
1. Bucket "documentos" existe?
2. Policies de storage estão configuradas?
3. Arquivo < 5MB?
```

## 📚 Referências

- [Estrutura XML NF-e](http://www.nfe.fazenda.gov.br/portal/principal.aspx)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [3-Way Matching](https://en.wikipedia.org/wiki/Three-way_matching)

## ✅ Conclusão

O módulo de **Notas Fiscais** está 100% funcional com:

- ✅ Registro (XML ou manual)
- ✅ Conferência automática (3-way matching)
- ✅ Workflow de aprovação
- ✅ Identificação de divergências
- ✅ Storage de XMLs

**Tempo de implementação:** ~4 horas  
**Complexidade:** Média  
**Pronto para produção:** ✅ Sim
