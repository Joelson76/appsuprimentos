# Marketing Skills Instaladas - SupriFlow

## 📋 Visão Geral

Foram instaladas **44 skills de marketing** profissionais do pacote `marketingskills v2.3.0` criado por Corey Haines. Essas skills fornecem frameworks, workflows e melhores práticas para tarefas específicas de marketing.

## 📍 Localização

- **Skills:** `.claude/skills/` (44 diretórios)
- **Contexto do Produto:** `.agents/product-marketing.md`

## 🎯 Contexto do Produto (Base para Todas as Skills)

O arquivo `.agents/product-marketing.md` contém informações essenciais sobre o SupriFlow:
- Target market e personas
- Value proposition e USPs
- Pricing e planos
- Concorrência e posicionamento
- Brand voice e tom de comunicação
- Mensagens-chave

**IMPORTANTE:** Todas as skills consultam este arquivo primeiro antes de executar qualquer tarefa de marketing.

## 📚 Skills Disponíveis por Categoria

### 🎨 Conversion Optimization (CRO)
- `cro` - Otimização de páginas e formulários para conversão
- `signup` - Fluxos de registro e criação de conta
- `onboarding` - Ativação pós-signup
- `popups` - Modais e overlays
- `paywalls` - Momentos de upgrade in-app

### ✍️ Content & Copy
- `copywriting` - Copy para páginas de marketing (homepage, landing pages)
- `copy-editing` - Edição e polimento de copy existente
- `cold-email` - E-mails de prospecção B2B e sequências
- `emails` - Fluxos de e-mail automatizados
- `social` - Conteúdo para redes sociais
- `video` - Criação de conteúdo em vídeo
- `image` - Geração e otimização de imagens
- `sms` - Marketing via SMS/MMS

### 🔍 SEO & Discovery
- `seo-audit` - Auditoria técnica e on-page de SEO
- `ai-seo` - Otimização para motores de busca AI (AEO, GEO, LLMO)
- `programmatic-seo` - Geração de páginas em escala
- `site-architecture` - Hierarquia de páginas, navegação, estrutura de URLs
- `competitors` - Páginas de comparação e alternativas
- `schema` - Structured data e schema markup
- `aso` - Otimização de App Store / Google Play

### 📣 Paid & Distribution
- `ads` - Campanhas no Google, Meta, LinkedIn
- `ad-creative` - Geração em massa de criativos para anúncios
- `directory-submissions` - Submissão para diretórios (SaaS, startup, etc)

### 📊 Measurement & Testing
- `analytics` - Setup de tracking de eventos
- `ab-testing` - Design de experimentos

### 🔄 Retention & Growth
- `churn-prevention` - Fluxos de cancelamento, save offers, recuperação de pagamento
- `referrals` - Programas de referência e afiliados
- `free-tools` - Ferramentas gratuitas para marketing
- `co-marketing` - Identificação de parceiros e campanhas conjuntas
- `community-marketing` - Construção e leverage de comunidades

### 📈 Strategy & Research
- `marketing-ideas` - 140 ideias de marketing para SaaS
- `marketing-plan` - Planos completos de marketing
- `marketing-psychology` - Modelos mentais e psicologia
- `customer-research` - Pesquisa e análise de clientes
- `competitor-profiling` - Research e perfil de concorrentes
- `content-strategy` - Planejamento de estratégia de conteúdo
- `launch` - Lançamentos de produtos e anúncios
- `pricing` - Pricing, packaging e monetização
- `product-marketing` - Criação/atualização do contexto de product marketing

### 💼 Sales & RevOps
- `revops` - Lifecycle de leads, scoring, routing, gestão de pipeline
- `sales-enablement` - Decks de vendas, one-pagers, scripts de demo
- `prospecting` - Encontrar e qualificar prospects
- `lead-magnets` - Criação de iscas digitais para captura de leads

## 🚀 Como Usar

### Método 1: Invocação Direta
```
/copywriting
/seo-audit
/cro
```

### Método 2: Pergunta Natural
Basta pedir para Claude e ele identificará a skill apropriada:

```
"Ajude-me a escrever o copy da homepage do SupriFlow"
→ Usa skill: copywriting

"Preciso otimizar a página de registro"
→ Usa skill: signup

"Como posso melhorar a conversão da landing page?"
→ Usa skill: cro

"Crie uma sequência de 5 e-mails de boas-vindas"
→ Usa skill: emails
```

### Método 3: Combinação de Skills
As skills funcionam em conjunto. Exemplo:

```
"Quero fazer um teste A/B na página de pricing"
→ Usa: ab-testing + pricing + cro
```

## 📖 Exemplos Práticos para SupriFlow

### 1. Landing Page de Conversão
```
"Preciso criar uma landing page para capturar leads de diretores de compras interessados no SupriFlow. Foco em indústrias."

→ Claude vai usar:
- product-marketing (contexto do produto)
- copywriting (estrutura e copy)
- cro (otimização para conversão)
- lead-magnets (se aplicável)
```

### 2. E-mail Drip Campaign
```
"Crie uma sequência de 3 e-mails para trial do SupriFlow: boas-vindas, tutorial e upgrade"

→ Claude vai usar:
- product-marketing (mensagens-chave)
- emails (estrutura de sequência)
- onboarding (fluxo de ativação)
```

### 3. SEO Strategy
```
"Quero ranquear para 'sistema de gestão de compras' no Google"

→ Claude vai usar:
- seo-audit (análise atual)
- ai-seo (otimização AI)
- content-strategy (plano de conteúdo)
- programmatic-seo (se aplicável)
```

### 4. Cold Email para Prospecção
```
"Escreva um e-mail frio para diretores de suprimentos de indústrias com 50-200 funcionários"

→ Claude vai usar:
- product-marketing (personas e dores)
- cold-email (frameworks de cold outreach)
- prospecting (qualificação)
```

### 5. Otimizar Signup Flow
```
"A taxa de conversão do registro está baixa. Como melhorar?"

→ Claude vai usar:
- signup (otimização de fluxo)
- cro (análise de conversão)
- ab-testing (setup de experimentos)
```

## 🎓 Recursos Adicionais

### Documentação Oficial
- Repo: https://github.com/coreyhaines31/marketingskills
- Site: https://agentskills.io

### Autor
- **Corey Haines** (https://corey.co)
- Agência: Conversion Factory (https://conversionfactory.co)
- Newsletter: Swipe Files (https://swipefiles.com)

### Cursos Relacionados
- Coding for Marketers (https://codingformarketers.com)

## 🔄 Atualizações

Para atualizar as skills no futuro:

```bash
# Via CLI (recomendado)
npx skills add coreyhaines31/marketingskills

# Ou manualmente
# 1. Baixar nova versão
# 2. Copiar skills/* para .claude/skills/
# 3. Atualizar .agents/product-marketing.md se necessário
```

## ⚠️ Importante

1. **Sempre mantenha o `.agents/product-marketing.md` atualizado** - É a base de conhecimento para todas as skills
2. **Skills trabalham em conjunto** - Não tenha medo de invocar múltiplas skills
3. **Contexto é rei** - Quanto mais contexto você der, melhores os resultados
4. **Adapte para o Brasil** - As skills são em inglês, mas o contexto do SupriFlow já está em português

## 📝 Próximos Passos Sugeridos

### Prioridade Alta (Marketing Essencial)
1. ✅ **Criar contexto de product marketing** (FEITO)
2. 🔲 **Escrever homepage** - `/copywriting`
3. 🔲 **Landing page para trial** - `/cro` + `/signup`
4. 🔲 **Sequência de onboarding** - `/emails` + `/onboarding`
5. 🔲 **SEO audit** - `/seo-audit`

### Prioridade Média
6. 🔲 **Cold email para prospects** - `/cold-email` + `/prospecting`
7. 🔲 **Social media content** - `/social`
8. 🔲 **Comparison pages** - `/competitors`
9. 🔲 **Pricing optimization** - `/pricing`
10. 🔲 **Lead magnet** - `/lead-magnets` (ex: "Guia de Compras Eficientes")

### Prioridade Baixa (Futuro)
11. 🔲 **Programa de referência** - `/referrals`
12. 🔲 **Free tool** - `/free-tools` (ex: "Calculadora de ROI em Compras")
13. 🔲 **Community** - `/community-marketing`
14. 🔲 **Directory submissions** - `/directory-submissions`

---

**Instalado em:** 2026-06-29  
**Versão:** marketingskills v2.3.0  
**Total de Skills:** 44
