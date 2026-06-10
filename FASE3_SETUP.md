# Fase 3 - Setup e Configuração

## ✅ O que foi implementado

### Migration SQL
- ✅ **4 tabelas** novas: recebimentos, itens_recebimento, notas_fiscais, contratos
- ✅ **3 enums** novos: status_recebimento, status_nf, status_contrato
- ✅ **Coluna calculada** (GENERATED): `divergencia` em itens_recebimento
- ✅ **Trigger**: atualiza status da PO após recebimento
- ✅ **Função**: `verificar_matching` para 3-way matching (PO x NF-e x Recebimento)
- ✅ **pg_cron Job**: alertas diários de vencimento de contratos

### Edge Functions
- ✅ **processar-nfe**: Parse de XML, 3-way matching, upload no Storage
- ✅ **enviar-alertas-contratos**: E-mails automáticos via pg_cron
- ✅ **upload-contrato**: Upload de PDF com validação de tipo e tamanho

### Frontend
- ✅ Página de **Notas Fiscais** com badges de divergência
- ✅ Página de **Contratos** com contador de dias restantes
- ✅ API Route para **exportação CSV** de NF-e
- ✅ Sidebar atualizada com novos menus

---

## 🚀 Como Configurar

### 1. Aplicar a Migration

No SQL Editor do Supabase:

1. Copie todo o conteúdo de: `supabase\migrations\20250103000000_fase3_fiscal_contratos.sql`
2. Cole no SQL Editor
3. Execute (Run)
4. Verifique se as tabelas foram criadas

### 2. Configurar Bucket Storage

**IMPORTANTE:** O bucket `documentos` deve ter sido criado na Fase 2. Se ainda não existe:

1. Vá em **Storage** no Supabase Dashboard
2. Crie bucket **`documentos`** (privado)
3. Aplique as policies de RLS:

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

-- Policy de atualização (para upsert de contratos)
CREATE POLICY "documentos_tenant_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );
```

### 3. Verificar pg_cron Job

O job de alertas de contratos foi criado automaticamente pela migration.

Para verificar:

1. Vá em **Database > Cron Jobs** no Supabase Dashboard
2. Procure por: `alertas-contratos-diarios`
3. Deve estar agendado para: `0 11 * * *` (todo dia às 11:00 UTC = 08:00 Brasília)

Para testar manualmente:

```sql
-- Executar o job manualmente
SELECT cron.unschedule('alertas-contratos-diarios');

-- Criar contrato de teste vencendo
INSERT INTO contratos (tenant_id, fornecedor_id, titulo, inicio, fim, status)
VALUES (
  '<seu-tenant-id>',
  '<algum-fornecedor-id>',
  'Contrato de Teste',
  CURRENT_DATE - INTERVAL '1 month',
  CURRENT_DATE + INTERVAL '15 days',
  'ATIVO'
);

-- Rodar update manual para marcar como VENCENDO
UPDATE contratos
SET status = 'VENCENDO'
WHERE status = 'ATIVO'
  AND fim BETWEEN CURRENT_DATE AND CURRENT_DATE + alerta_dias;

-- Recriar o job
SELECT cron.schedule(
  'alertas-contratos-diarios',
  '0 11 * * *',
  $$
    UPDATE contratos SET status = 'VENCENDO'
    WHERE status = 'ATIVO' AND fim BETWEEN CURRENT_DATE AND CURRENT_DATE + alerta_dias;
    UPDATE contratos SET status = 'VENCIDO'
    WHERE status IN ('ATIVO', 'VENCENDO') AND fim < CURRENT_DATE;
  $$
);
```

---

## 📋 Funcionalidades Disponíveis

### ✅ Recebimento de Mercadorias
- Vincular a uma PO existente
- Registrar quantidade recebida por item
- Divergências calculadas automaticamente (coluna GENERATED)
- Status da PO atualizado via trigger (PARCIAL ou COMPLETO)

### ✅ Notas Fiscais (NF-e)
- Upload e parse de XML
- 3-way matching automático:
  - Compara fornecedor CNPJ
  - Compara valor total (tolerância 1%)
  - Verifica se há recebimento registrado
- Divergências armazenadas em JSONB
- Download de XML via URL assinada
- Exportação CSV para ERP

### ✅ Contratos
- Gestão de contratos com fornecedores
- Upload de PDF (máx 10MB)
- Alertas automáticos de vencimento
- Status atualizado via pg_cron:
  - ATIVO → VENCENDO (quando faltam X dias)
  - VENCENDO/ATIVO → VENCIDO (quando vence)
- E-mails enviados via Resend para ADMIN e GESTOR

---

## 🎯 Testando as Funcionalidades

### Testar Processamento de NF-e

Você precisará de um XML de NF-e válido. Exemplo de estrutura:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc>
  <NFe>
    <infNFe Id="NFe...">
      <ide>
        <nNF>12345</nNF>
        <serie>1</serie>
        <dhEmi>2026-06-09T10:00:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
      </emit>
      <total>
        <ICMSTot>
          <vNF>1500.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>
```

**Chamada via JavaScript:**

```typescript
const formData = new FormData()
formData.append('xmlFile', xmlFile) // File object
formData.append('pedidoId', 'uuid-da-po')
formData.append('tenantId', 'uuid-do-tenant')

const { data } = await supabase.functions.invoke('processar-nfe', {
  body: formData,
})

console.log(data) // { success, notaFiscal, temDivergencias, divergencias }
```

### Testar Upload de Contrato

```typescript
const formData = new FormData()
formData.append('pdfFile', pdfFile) // File object
formData.append('contratoId', 'uuid-do-contrato')
formData.append('tenantId', 'uuid-do-tenant')

const { data } = await supabase.functions.invoke('upload-contrato', {
  body: formData,
})

console.log(data.downloadUrl) // URL assinada para download
```

### Testar Exportação CSV

```
GET /api/relatorios/notas-fiscais?dataInicio=2026-01-01&dataFim=2026-12-31
```

Retorna arquivo CSV com BOM UTF-8 (abre corretamente no Excel).

---

## 🔧 Dados de Teste

### Inserir Contrato de Teste

```sql
-- Certifique-se de ter um fornecedor cadastrado
INSERT INTO contratos (
  tenant_id,
  fornecedor_id,
  titulo,
  numero,
  valor_total,
  inicio,
  fim,
  status,
  alerta_dias
)
VALUES (
  '<seu-tenant-id>',
  '<fornecedor-id>',
  'Contrato de Fornecimento 2026',
  'CTR-2026-001',
  50000.00,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '60 days',
  'ATIVO',
  30
);
```

### Inserir NF-e Manualmente (sem XML)

```sql
INSERT INTO notas_fiscais (
  tenant_id,
  pedido_id,
  numero,
  serie,
  emissao,
  valor_total,
  status
)
VALUES (
  '<seu-tenant-id>',
  '<pedido-id>',
  '123456',
  '1',
  CURRENT_DATE,
  1500.00,
  'PENDENTE'
);
```

---

## ✅ Status: PRONTO PARA TESTAR

A Fase 3 está completa com:
- ✅ Banco de dados estruturado
- ✅ RLS e isolamento multi-tenant
- ✅ Edge Functions prontas
- ✅ Páginas de visualização
- ✅ Jobs automáticos configurados

**Próximo passo:** Aplicar a migration e testar o processamento de NF-e!
