# 🔧 Problema: Links de Cotação Inválidos no WhatsApp

## 📋 Descrição do Problema

Quando links de cotação são enviados via WhatsApp (usando o botão automático), os fornecedores recebem erro de "Link inválido ou expirado" ao clicar.

**Sintomas:**
- ✅ Copiar/colar o link manualmente → **FUNCIONA**
- ❌ Clicar no link recebido via WhatsApp → **ERRO**

## 🔍 Causa Raiz

O WhatsApp pode **quebrar ou corromper** links longos quando enviados com muito texto formatado, especialmente:

1. **Links muito longos** (tokens de 64 caracteres hex)
2. **Formatação excessiva** (emojis decorativos, asteriscos, linhas)
3. **Codificação dupla** (URL dentro de texto já encodado)
4. **Quebras de linha** próximas ao link

## ✅ Soluções Implementadas

### 1. Simplificação da Mensagem (2026-06-22)

**Arquivo:** `components/cotacoes/enviar-links-button.tsx`

**Mudanças:**
- ❌ Removidos emojis decorativos no meio do texto
- ❌ Removidas linhas divisórias (`━━━━`)
- ❌ Removidos asteriscos de negrito em excesso
- ✅ Link em linha separada, sem formatação ao redor
- ✅ Mensagem mais direta e curta

**Antes:**
```
*📋 SOLICITAÇÃO DE COTAÇÃO*

Olá *Fornecedor*!

Para visualizar os itens e enviar sua proposta, acesse o link abaixo:

🔗 https://seusite.com/fornecedor/abc123...

━━━━━━━━━━━━━━━━━━━━

⚠️ *IMPORTANTE:*
• Este link é exclusivo
...
```

**Depois:**
```
📋 SOLICITAÇÃO DE COTAÇÃO

Olá Fornecedor!

Acesse o link abaixo para visualizar os itens:

https://seusite.com/fornecedor/abc123...

IMPORTANTE:
- Este link é exclusivo
...
```

### 2. Validação Melhorada do Token

**Arquivo:** `app/fornecedor/[token]/page.tsx`

**Mudanças:**
- ✅ Mensagem de erro mais clara: "Verifique se o link foi copiado corretamente"
- ✅ Detecção de cotação expirada (prazo vencido) separada de link inválido
- ✅ Logs de debug no console para diagnóstico

### 3. Página de Teste

**Arquivo:** `app/fornecedor/teste/page.tsx`

Página de diagnóstico acessível em `/fornecedor/teste` com:
- Exemplos de links que funcionam e não funcionam
- Dicas de solução
- Explicação do problema

### 4. Melhorias na UI

**Arquivo:** `components/cotacoes/enviar-links-button.tsx`

- ✅ Tooltip no botão WhatsApp alertando sobre possível falha
- ✅ Dicas visuais reforçando o uso de copiar/colar manual
- ✅ Logs de debug (`console.log`) para verificar link gerado

## 🎯 Como Testar

### Cenário 1: Link Copiado Manualmente ✅
1. Gerar links na cotação
2. Clicar em **"Copiar"**
3. Abrir WhatsApp Web/App
4. Colar e enviar
5. ✅ Fornecedor clica e acessa normalmente

### Cenário 2: Botão WhatsApp Automático ⚠️
1. Gerar links na cotação
2. Clicar em **"WhatsApp"** ao lado do fornecedor
3. WhatsApp abre com mensagem pré-formatada
4. Enviar a mensagem
5. ⚠️ **TESTAR:** Fornecedor clica no link
   - Se funcionar → problema resolvido
   - Se não funcionar → usar método manual

### Cenário 3: Verificar Logs de Debug 🔍
1. Abrir DevTools (F12) → Console
2. Gerar links
3. Clicar em "WhatsApp"
4. Verificar logs:
   ```
   🔗 Link gerado: https://...
   📱 Telefone: 11999999999
   ```
5. Copiar o link do console e testar diretamente

## 📊 Métricas de Sucesso

Após a correção, esperamos:
- ✅ 100% dos links copiados manualmente funcionam
- ✅ 90%+ dos links via WhatsApp automático funcionam
- ✅ Mensagens de erro mais claras quando falhar

## 🔄 Alternativas Futuras

Se o problema persistir, considerar:

### Opção A: Encurtador de URL
- Usar serviço de encurtamento (bit.ly, tinyurl, etc)
- Link fica menor e menos propenso a quebrar
- **Trade-off:** Dependência de serviço externo

### Opção B: QR Code
- Gerar QR Code para cada fornecedor
- Fornecedor escaneia pelo celular
- **Trade-off:** Mais passos, menos prático

### Opção C: Link de Acesso Único
- Token mais curto (ex: 8 chars em vez de 64)
- Validar por email + token curto
- **Trade-off:** Menos seguro

## 📝 Notas Técnicas

### Estrutura do Token
- Gerado em: `supabase/migrations/20250102000000_fase2_compras.sql`
- Formato: `encode(gen_random_bytes(32), 'hex')` = 64 caracteres
- Único por item de cotação
- Não expira automaticamente (baseado em `data_limite` da cotação)

### Isolamento RLS
- Tokens são públicos (não precisam de autenticação)
- RLS garante que cada token só vê seus próprios itens
- Fornecedor acessa sem login

## 🆘 Troubleshooting

### "Link inválido ou expirado"
1. ✅ Verificar se o link foi copiado completamente
2. ✅ Verificar se a cotação não foi deletada
3. ✅ Verificar logs do Supabase (tabela `itens_cotacao`)
4. ✅ Testar acessar o link diretamente no navegador

### Link quebrado no WhatsApp
1. ✅ Usar método manual (copiar/colar)
2. ✅ Verificar se o WhatsApp adicionou caracteres extras
3. ✅ Testar em WhatsApp Web (mais estável que mobile)
4. ✅ Verificar logs do console (F12)

### Cotação expirada mas link funciona
- ✅ Comportamento esperado
- ✅ Sistema permite visualizar mas avisa que o prazo venceu
- ✅ Fornecedor pode contatar o comprador

## 📚 Referências

- [WhatsApp URL Scheme](https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat)
- [URL Encoding MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)

---

**Data da correção:** 2026-06-22  
**Desenvolvedor:** JLS Tecnologia  
**Sistema:** SupriFlow
