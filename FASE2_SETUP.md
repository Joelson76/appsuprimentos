# Fase 2 - Setup e Configuração

## ✅ O que foi implementado

### Migration SQL
- ✅ **11 tabelas** novas: fornecedores, categorias, centros_custo, requisicoes, itens_requisicao, regras_aprovacao, aprovacoes, cotacoes, itens_cotacao, ordens_compra, itens_po, avaliacoes_fornecedor
- ✅ **7 enums** novos: status_fornecedor, urgencia_tipo, status_requisicao, status_po, status_cotacao, tipo_aprovacao, status_aprovacao
- ✅ **Numeração automática**: REQ-YYYY-NNNN, COT-YYYY-NNNN, PO-YYYY-NNNN via triggers
- ✅ **RLS** habilitado em todas as tabelas
- ✅ **Stored Procedures**: aprovar_requisicao, reprovar_requisicao
- ✅ **Trigger de score**: recalcula automaticamente score do fornecedor após avaliação

### Edge Functions
- ✅ **buscar-cnpj**: Proxy para ReceitaWS (evita CORS)
- ✅ **gerar-pdf-po**: Gera PDF da PO e salva no Storage
- ✅ **send-po-email**: Envia PO por e-mail via Resend

### Frontend
- ✅ Página de **Fornecedores** com listagem e cards de métricas
- ✅ Página de **Requisições** com filtros por status
- ✅ Página de **Pedidos** com valor total e tracking
- ✅ Sidebar atualizada com novos menus
- ✅ Tipos TypeScript completos

---

## 🚀 Como Configurar

### 1. Aplicar a Migration

No SQL Editor do Supabase:

1. Copie todo o conteúdo de: `supabase\migrations\20250102000000_fase2_compras.sql`
2. Cole no SQL Editor
3. Execute (Run)
4. Verifique se as tabelas foram criadas

### 2. Criar Bucket no Storage

No dashboard do Supabase:

1. Vá em **Storage**
2. Crie um bucket chamado **`documentos`**
3. Configure como **privado**
4. Adicione policy de RLS:

```sql
-- Policy para bucket documentos
CREATE POLICY "documentos_tenant" ON storage.objects
  FOR ALL USING (
    bucket_id = 'documentos' AND
    (storage.foldername(name))[1] = (auth.jwt()->'app_metadata'->>'tenant_id')
  );
```

### 3. Deploy das Edge Functions (Opcional)

Se quiser testar as Edge Functions localmente:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Deploy das functions
supabase functions deploy buscar-cnpj
supabase functions deploy gerar-pdf-po
supabase functions deploy send-po-email
```

**Nota:** As Edge Functions já estão prontas mas precisam de deploy manual.

---

## 📋 Funcionalidades Disponíveis

### ✅ Fornecedores
- Listagem com score visual (estrelas)
- Cards de métricas (Total, Ativos, Em Homologação, Score Médio)
- Status com badges coloridos
- Formatação automática de CNPJ

### ✅ Requisições
- Numeração automática (REQ-2026-0001)
- Status workflow (Rascunho → Aprovação → Aprovada → Cotação → Pedido)
- Badges de urgência (BAIXA, NORMAL, ALTA, CRÍTICA)
- Cards de métricas por status

### ✅ Pedidos de Compra (PO)
- Numeração automática (PO-2026-0001)
- Tracking completo do status
- Cálculo automático de valor total
- Formatação de moeda brasileira

---

## 🎯 Próximos Passos

### Para Implementar Formulários:

1. **Cadastro de Fornecedor**
   - Buscar CNPJ via Edge Function
   - Validação com cpf-cnpj-validator
   - Auto-preenchimento de dados

2. **Criar Requisição**
   - Multi-step form
   - Adicionar itens dinamicamente
   - Enviar para aprovação

3. **Workflow de Aprovação**
   - Configurar regras por perfil/valor
   - Notificações via e-mail
   - Histórico de aprovações

4. **Portal de Cotação**
   - Rota pública sem autenticação
   - Fornecedor responde via token
   - Comparativo automático

5. **Gerar PO**
   - PDF com logo da empresa
   - Envio automático por e-mail
   - Tracking de status

---

## 🔧 Dados de Teste

Para testar, você pode inserir dados manualmente via SQL Editor:

### Inserir Fornecedor de Teste

```sql
-- Substitua <seu-tenant-id> pelo ID do seu tenant
INSERT INTO fornecedores (tenant_id, razao_social, cnpj, email, status)
VALUES (
  '<seu-tenant-id>',
  'Fornecedor Teste LTDA',
  '12345678000190',
  'contato@fornecedor.com',
  'ATIVO'
);
```

### Inserir Requisição de Teste

```sql
-- O número será gerado automaticamente
INSERT INTO requisicoes (tenant_id, solicitante_id, descricao, urgencia)
VALUES (
  '<seu-tenant-id>',
  '<seu-user-id>',
  'Requisição de teste',
  'NORMAL'
);
```

---

## 📊 Estrutura Implementada

```
Fornecedor
    ↓
Requisição → Aprovação → Cotação → Ordem de Compra
    ↓            ↓          ↓            ↓
  Itens      Multi-nível  Respostas    Itens
                                        ↓
                                   Avaliação
```

---

## ✅ Status: PRONTO PARA TESTAR

A Fase 2 está completa com:
- ✅ Banco de dados estruturado
- ✅ RLS e isolamento multi-tenant
- ✅ Numeração automática
- ✅ Edge Functions prontas
- ✅ Páginas de visualização

**Próximo passo:** Testar a aplicação das migrations e visualizar as páginas!
