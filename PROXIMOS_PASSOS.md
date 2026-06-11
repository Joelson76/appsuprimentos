# ✅ Sistema de Marcar Vencedor e Gerar Pedido

## 📋 O que foi implementado:

1. **Migration de Pedidos** (`supabase/migrations/20260611000000_pedidos_compra.sql`)
   - Tabela `pedidos` com numeração automática (PO-2026-0001)
   - Tabela `itens_pedido`
   - RLS configurado
   - Triggers para auto-numeração

2. **Componente MarcarVencedorButton** (`components/cotacoes/marcar-vencedor-button.tsx`)
   - Dialog de confirmação
   - Marca fornecedor como vencedor
   - Gera pedido automaticamente
   - Encerra a cotação

3. **Integração na página de detalhes** (`app/(dashboard)/cotacoes/[id]/page.tsx`)
   - Botão "Marcar como Vencedor" ao lado do total de cada fornecedor
   - Só aparece se a cotação não estiver encerrada

## 🚀 Para ativar:

### 1. Execute a migration no Supabase SQL Editor:

1. Acesse: https://supabase.com/dashboard → Seu Projeto → SQL Editor
2. Abra o arquivo: `supabase/migrations/20260611000000_pedidos_compra.sql`
3. Copie TODO o conteúdo
4. Cole no SQL Editor
5. Clique em "RUN"

### 2. Teste o fluxo:

1. Acesse uma cotação com propostas respondidas
2. Clique em "Marcar como Vencedor" no fornecedor escolhido
3. Confirme no dialog
4. Sistema vai:
   - ✅ Marcar o fornecedor como vencedor
   - ✅ Gerar o Pedido de Compra (PO-2026-0001)
   - ✅ Copiar todos os itens e valores
   - ✅ Encerrar a cotação
   - ✅ Redirecionar para a página do pedido

## 📌 Próximas funcionalidades sugeridas:

- [ ] Página de listagem de pedidos (`/pedidos`)
- [ ] Página de detalhes do pedido (`/pedidos/[id]`)
- [ ] Aprovação de pedidos (workflow)
- [ ] Envio de pedido para o fornecedor (e-mail/PDF)
- [ ] Recebimento de mercadorias
- [ ] Comparação visual de propostas (antes de escolher vencedor)

## 🎯 Status Atual:

✅ Requisições
✅ Cotações
✅ Portal do Fornecedor
✅ Marcar Vencedor
✅ Gerar Pedido
⏳ Gestão de Pedidos (próximo)
