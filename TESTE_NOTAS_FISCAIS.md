# 🧪 Guia Rápido - Testar Notas Fiscais

## 📋 Pré-requisitos

1. **Servidor rodando**
```bash
npm run dev
# http://localhost:3000
```

2. **Bucket de Storage criado** (executar uma vez)
```sql
-- Copiar e executar no Supabase SQL Editor:
-- supabase/migrations/20260612000000_storage_documentos.sql

-- Ou via CLI (se tiver):
supabase migration up
```

3. **Pedido de compra existente**
   - Precisa ter ao menos 1 pedido com status APROVADO, ENVIADO ou RECEBIDO

## 🚀 Passo a Passo

### 1. Acessar Notas Fiscais
```
http://localhost:3000/notas-fiscais
```

Você verá:
- ✅ KPIs no topo (Total, Valor, Conferidas, Divergentes)
- ✅ Botão "Processar NF-e"
- ✅ Mensagem "Nenhuma nota fiscal processada" (se for a primeira)

---

### 2. Registrar uma NF-e

#### Opção A: Upload de XML (Recomendado para teste real)

1. Clicar em **"Processar NF-e"**
2. Fazer upload de um arquivo XML de NF-e
3. Dados serão preenchidos automaticamente:
   - Número da NF
   - Série
   - Chave de Acesso
   - Data de Emissão
   - Valor Total

4. Selecionar o **Pedido de Compra** vinculado
5. Clicar em **"Processar NF-e"**

#### Opção B: Cadastro Manual (Para teste rápido)

1. Clicar em **"Processar NF-e"**
2. Clicar em **"Manual"**
3. Preencher:
   ```
   Pedido: PO-2026-0001 (selecionar da lista)
   Número: 123456
   Série: 1
   Chave de Acesso: (opcional)
   Data de Emissão: 12/06/2026
   Valor Total: 1500.00
   ```
4. Clicar em **"Processar NF-e"**

**Resultado esperado:**
- ✅ Toast: "Nota fiscal registrada com sucesso!"
- ✅ NF aparece na lista com status **PENDENTE**
- ✅ KPIs atualizados

---

### 3. Visualizar Detalhes

1. Clicar em **"Detalhes"** na NF criada
2. Você verá:
   - ✅ Dados da NF-e (número, série, valor, data)
   - ✅ Dados do Pedido vinculado
   - ✅ Itens do pedido
   - ✅ Status: PENDENTE
   - ✅ Botão **"Conferir Automaticamente"**

---

### 4. Conferir NF-e (3-Way Matching)

1. Na página de detalhes, clicar em **"Conferir Automaticamente"**
2. Confirmar no modal
3. O sistema irá:
   - ✅ Comparar valor da NF vs Pedido
   - ✅ Comparar quantidades (se houver recebimento)
   - ✅ Identificar divergências

**Cenário 1: SEM divergências**
```
Valor NF = Valor PO
Status muda para: CONFERIDA ✅
Toast: "Conferência concluída: NF-e está conforme!"
```

**Cenário 2: COM divergências**
```
Valor NF ≠ Valor PO (diferença > R$ 0,01)
Status muda para: DIVERGENTE ⚠️
Toast: "Conferência concluída: 1 divergência(s) encontrada(s)"
Box vermelho aparece no topo com detalhes
```

---

### 5. Aprovar NF-e

**Pré-requisito:** Status = CONFERIDA

1. Na página de detalhes, clicar em **"Aprovar NF-e"**
2. Confirmar no modal
3. Status muda para: **APROVADA** ✅
4. Timeline atualizada

---

### 6. Reprovar NF-e

**Pré-requisito:** Status = CONFERIDA

1. Na página de detalhes, clicar em **"Reprovar"**
2. Informar motivo:
   ```
   Ex: Divergência de valores não justificada
   ```
3. Confirmar
4. Status muda para: **DIVERGENTE** ❌
5. Motivo fica registrado

---

## 🎯 Cenários de Teste

### Teste 1: NF Conforme (Caminho Feliz)
```
1. Criar pedido de R$ 1.000,00
2. Registrar NF de R$ 1.000,00
3. Conferir → Status: CONFERIDA ✅
4. Aprovar → Status: APROVADA ✅
```

### Teste 2: Divergência de Valor
```
1. Criar pedido de R$ 1.000,00
2. Registrar NF de R$ 1.200,00 (diferença de R$ 200)
3. Conferir → Status: DIVERGENTE ⚠️
4. Box vermelho aparece:
   "Divergência de valor: NF R$ 1.200,00 vs PO R$ 1.000,00"
5. Reprovar com motivo
```

### Teste 3: Upload de XML
```
1. Conseguir um XML de NF-e real
2. Fazer upload
3. Verificar se dados foram extraídos corretamente
4. Selecionar pedido
5. Processar
```

### Teste 4: Divergência de Quantidade (com recebimento)
```
1. Criar pedido com 10 unidades
2. Registrar recebimento de 8 unidades (divergência)
3. Registrar NF
4. Conferir → Status: CONFERIDA (divergência MÉDIA)
5. Box aparece:
   "2 item(ns) com divergência de quantidade"
```

---

## 📊 KPIs Esperados

Após criar algumas NFs, a tela principal deve mostrar:

```
┌─────────────┬──────────────┬────────────┬─────────────────┐
│ Total de NFs│ Valor Total  │ Conferidas │ Com Divergência │
├─────────────┼──────────────┼────────────┼─────────────────┤
│      5      │  R$ 7.500,00 │     3      │        2        │
└─────────────┴──────────────┴────────────┴─────────────────┘
```

---

## 🐛 Troubleshooting

### Erro: "Bucket not found"
```bash
# Solução: Executar migração de storage
# Copiar SQL de: supabase/migrations/20260612000000_storage_documentos.sql
# Colar no Supabase SQL Editor
# Executar
```

### Erro: "Nenhum pedido disponível para selecionar"
```bash
# Solução: Criar um pedido primeiro
# 1. Dashboard → Requisições → Nova
# 2. Aprovar requisição
# 3. Criar cotação → Responder → Gerar pedido
```

### Upload de XML falha
```bash
# Verificar:
1. Arquivo é .xml válido?
2. Bucket "documentos" existe? (ver migração)
3. Arquivo < 5MB?
```

### Parser de XML não funciona
```bash
# XML deve conter tags obrigatórias:
- <NFe>
- <infNFe>
- <ide>
  - <nNF>
  - <serie>
  - <dhEmi>
- <total>
  - <ICMSTot>
    - <vNF>
```

### Conferência não identifica divergências
```bash
# Verificar:
1. Valores estão corretos?
2. Diferença > R$ 0,01?
3. Pedido vinculado está correto?
```

---

## ✅ Checklist de Validação

Após testar, você deve conseguir:

- [ ] Acessar `/notas-fiscais`
- [ ] Ver KPIs no topo
- [ ] Clicar em "Processar NF-e"
- [ ] Fazer upload de XML (ou cadastro manual)
- [ ] Ver NF na lista com status PENDENTE
- [ ] Clicar em "Detalhes"
- [ ] Conferir automaticamente
- [ ] Status muda para CONFERIDA ou DIVERGENTE
- [ ] Aprovar NF (se CONFERIDA)
- [ ] Reprovar NF (se CONFERIDA)
- [ ] Ver divergências (se houver)
- [ ] Timeline atualizada
- [ ] KPIs atualizados

---

## 📸 Screenshots Esperados

### Tela Principal
```
✓ Header "Notas Fiscais"
✓ Botão "Processar NF-e"
✓ 4 cards de KPIs
✓ Tabela com colunas: Número, PO, Fornecedor, Emissão, Valor, Status, Divergências, Ações
```

### Modal "Processar NF-e"
```
✓ Upload de arquivo .xml
✓ Campos: Pedido, Número, Série, Chave, Data, Valor
✓ Botão "Manual" para alternar
✓ Botões: Cancelar, Processar NF-e
```

### Página de Detalhes
```
✓ Header com número da NF + status badge
✓ Card "Dados da NF-e"
✓ Card "Pedido de Compra"
✓ Card "Itens do Pedido"
✓ Card "Recebimento" (se houver)
✓ Card "Histórico" (timeline)
✓ Box vermelho de divergências (se houver)
```

---

## 🎉 Sucesso!

Se você conseguiu:
- ✅ Registrar uma NF-e
- ✅ Conferir automaticamente
- ✅ Ver divergências (ou não)
- ✅ Aprovar/Reprovar

**Parabéns! O módulo está funcionando perfeitamente!** 🎊

---

## 📚 Próximos Passos

Agora que o módulo de Notas Fiscais está OK, você pode:

1. **Testar integração completa:**
   - Requisição → Cotação → Pedido → Recebimento → **NF-e**

2. **Explorar melhorias:**
   - Parser completo de itens do XML
   - Download de DANFE (PDF)
   - Relatórios de divergências
   - Notificações por e-mail

3. **Implementar outros módulos:**
   - Contratos
   - Estoque
   - Pagamentos/Billing

---

**Desenvolvido com ❤️ pelo SupriFlow**
