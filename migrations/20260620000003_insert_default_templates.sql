-- Migration: Inserir templates de email padrão
-- Data: 2026-06-20
-- Nota: Este SQL deve ser executado APÓS a criação de um novo tenant

-- Função para criar templates padrão para um tenant
CREATE OR REPLACE FUNCTION criar_templates_padrao(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Template: Cotação Enviada
  INSERT INTO email_templates (
    tenant_id, tipo, nome, descricao, assunto, corpo_html, corpo_texto, ativo, variaveis_disponiveis
  ) VALUES (
    p_tenant_id,
    'COTACAO_ENVIADA',
    'Padrão - Cotação Enviada',
    'Template padrão para envio de cotações a fornecedores',
    'Nova Solicitação de Cotação #{{numero_cotacao}} - {{nome_empresa}}',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .info-box { background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-box h3 { margin: 0 0 10px 0; color: #667eea; font-size: 16px; }
    .info-list { list-style: none; padding: 0; margin: 10px 0; }
    .info-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-list li:last-child { border-bottom: none; }
    .info-list strong { display: inline-block; width: 140px; color: #666; }
    .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .button:hover { background: #5568d3; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .divider { height: 1px; background: #eee; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Nova Solicitação de Cotação</h1>
    </div>

    <div class="content">
      <p>Olá, <strong>{{fornecedor_nome}}</strong>!</p>

      <p>A empresa <strong>{{nome_empresa}}</strong> está solicitando uma cotação de preços para os itens relacionados abaixo.</p>

      <div class="info-box">
        <h3>Informações da Cotação</h3>
        <ul class="info-list">
          <li><strong>Número:</strong> {{numero_cotacao}}</li>
          <li><strong>Total de Itens:</strong> {{total_itens}}</li>
          <li><strong>Prazo Resposta:</strong> {{prazo_resposta}}</li>
        </ul>
      </div>

      <p>Por favor, nos envie sua melhor proposta incluindo:</p>
      <ul>
        <li>Preço unitário e total de cada item</li>
        <li>Prazo de entrega</li>
        <li>Condições de pagamento</li>
        <li>Validade da proposta</li>
      </ul>

      <div style="text-align: center;">
        <a href="https://app.supriflow.com.br/fornecedor/cotacoes/{{numero_cotacao}}" class="button">
          Responder Cotação
        </a>
      </div>

      <div class="divider"></div>

      <p style="font-size: 13px; color: #666;">
        Dúvidas? Entre em contato conosco respondendo este e-mail ou através dos canais de atendimento.
      </p>
    </div>

    <div class="footer">
      <p><strong>{{nome_empresa}}</strong></p>
      <p>Este é um e-mail automático. Por favor, não responda.</p>
    </div>
  </div>
</body>
</html>',
    'Olá, {{fornecedor_nome}}!

A empresa {{nome_empresa}} está solicitando uma cotação de preços.

INFORMAÇÕES DA COTAÇÃO
- Número: {{numero_cotacao}}
- Total de Itens: {{total_itens}}
- Prazo para Resposta: {{prazo_resposta}}

Por favor, nos envie sua melhor proposta incluindo:
- Preço unitário e total de cada item
- Prazo de entrega
- Condições de pagamento
- Validade da proposta

Atenciosamente,
{{nome_empresa}}',
    true,
    '{"nome_empresa": "Nome da sua empresa", "numero_cotacao": "Número da cotação", "fornecedor_nome": "Nome do fornecedor", "total_itens": "Quantidade de itens", "prazo_resposta": "Prazo em dias"}'::jsonb
  ) ON CONFLICT (tenant_id, tipo) DO NOTHING;

  -- Template: Pedido Criado
  INSERT INTO email_templates (
    tenant_id, tipo, nome, descricao, assunto, corpo_html, corpo_texto, ativo, variaveis_disponiveis
  ) VALUES (
    p_tenant_id,
    'PEDIDO_CRIADO',
    'Padrão - Pedido de Compra',
    'Template para confirmação de pedido enviado ao fornecedor',
    '🛒 Novo Pedido de Compra #{{numero_pedido}} - {{nome_empresa}}',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .highlight-box { background: #ecfdf5; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .highlight-box .label { color: #059669; font-size: 14px; font-weight: bold; text-transform: uppercase; }
    .highlight-box .value { color: #10b981; font-size: 32px; font-weight: bold; margin: 10px 0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
    .info-item { background: #f8f9fa; padding: 15px; border-radius: 6px; }
    .info-item .label { font-size: 12px; color: #666; text-transform: uppercase; }
    .info-item .value { font-size: 18px; font-weight: bold; color: #333; margin-top: 5px; }
    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 Pedido de Compra Confirmado</h1>
    </div>

    <div class="content">
      <p>Prezado(a) <strong>{{fornecedor_nome}}</strong>,</p>

      <p>Confirmamos o pedido de compra conforme detalhes abaixo:</p>

      <div class="highlight-box">
        <div class="label">Valor Total do Pedido</div>
        <div class="value">{{valor_total}}</div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">Número do Pedido</div>
          <div class="value">{{numero_pedido}}</div>
        </div>
        <div class="info-item">
          <div class="label">Prazo de Entrega</div>
          <div class="value">{{prazo_entrega}}</div>
        </div>
      </div>

      <div class="alert">
        <strong>⚠️ Atenção:</strong> Por favor, confirme o recebimento deste pedido e nos envie a previsão de entrega.
      </div>

      <p><strong>Próximos passos:</strong></p>
      <ol>
        <li>Confirmar recebimento do pedido</li>
        <li>Enviar nota fiscal eletrônica (NF-e)</li>
        <li>Agendar data de entrega</li>
        <li>Providenciar transporte/entrega</li>
      </ol>

      <p style="margin-top: 30px;">Em caso de dúvidas, entre em contato conosco.</p>
    </div>

    <div class="footer">
      <p><strong>{{nome_empresa}}</strong></p>
      <p>Departamento de Compras e Suprimentos</p>
    </div>
  </div>
</body>
</html>',
    'Prezado(a) {{fornecedor_nome}},

Confirmamos o PEDIDO DE COMPRA:

Número: {{numero_pedido}}
Valor Total: {{valor_total}}
Prazo de Entrega: {{prazo_entrega}}

PRÓXIMOS PASSOS:
1. Confirmar recebimento do pedido
2. Enviar nota fiscal eletrônica (NF-e)
3. Agendar data de entrega
4. Providenciar transporte/entrega

Em caso de dúvidas, entre em contato conosco.

Atenciosamente,
{{nome_empresa}}
Departamento de Compras',
    true,
    '{"nome_empresa": "Nome da sua empresa", "numero_pedido": "Número do pedido", "fornecedor_nome": "Nome do fornecedor", "valor_total": "Valor total formatado", "prazo_entrega": "Prazo em dias"}'::jsonb
  ) ON CONFLICT (tenant_id, tipo) DO NOTHING;

  -- Template: Estoque Baixo
  INSERT INTO email_templates (
    tenant_id, tipo, nome, descricao, assunto, corpo_html, corpo_texto, ativo, variaveis_disponiveis
  ) VALUES (
    p_tenant_id,
    'ESTOQUE_BAIXO',
    'Padrão - Alerta de Estoque',
    'Alerta automático quando estoque atinge nível mínimo',
    '⚠️ ALERTA: Estoque baixo de {{produto_nome}}',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .alert-box { background: #fef2f2; border: 3px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .alert-icon { font-size: 48px; text-align: center; margin-bottom: 15px; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; padding: 15px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #ef4444; }
    .stat-label { font-size: 12px; color: #666; text-transform: uppercase; margin-top: 5px; }
    .action-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; background: #ef4444; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Alerta de Estoque Baixo</h1>
    </div>

    <div class="content">
      <div class="alert-box">
        <div class="alert-icon">📦❗</div>
        <h2 style="margin: 0 0 10px 0; color: #dc2626; text-align: center;">ATENÇÃO: Estoque Crítico</h2>
        <p style="text-align: center; font-size: 18px; margin: 0;">
          <strong>{{produto_nome}}</strong>
        </p>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-value">{{estoque_atual}}</div>
          <div class="stat-label">Estoque Atual</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{estoque_minimo}}</div>
          <div class="stat-label">Estoque Mínimo</div>
        </div>
      </div>

      <div class="action-box">
        <strong>✅ Ação Recomendada:</strong>
        <p style="margin: 10px 0 0 0;">
          Realize uma nova compra deste produto o quanto antes para evitar ruptura de estoque e parada nas operações.
        </p>
      </div>

      <div style="text-align: center;">
        <a href="https://app.supriflow.com.br/requisicoes/nova" class="button">
          Criar Requisição de Compra
        </a>
      </div>

      <p style="font-size: 13px; color: #666; margin-top: 20px;">
        <strong>Dica:</strong> Configure alertas personalizados para cada produto e receba notificações antes que o estoque fique crítico.
      </p>
    </div>

    <div class="footer">
      <p><strong>{{nome_empresa}}</strong></p>
      <p>Sistema de Gestão de Estoque - SupriFlow</p>
    </div>
  </div>
</body>
</html>',
    'ALERTA DE ESTOQUE BAIXO

Produto: {{produto_nome}}
Estoque Atual: {{estoque_atual}}
Estoque Mínimo: {{estoque_minimo}}

AÇÃO RECOMENDADA:
Realize uma nova compra deste produto o quanto antes para evitar ruptura de estoque.

{{nome_empresa}}
Sistema de Gestão de Estoque',
    true,
    '{"nome_empresa": "Nome da sua empresa", "produto_nome": "Nome do produto", "estoque_atual": "Quantidade atual", "estoque_minimo": "Quantidade mínima"}'::jsonb
  ) ON CONFLICT (tenant_id, tipo) DO NOTHING;

  -- Template: Boas-vindas
  INSERT INTO email_templates (
    tenant_id, tipo, nome, descricao, assunto, corpo_html, corpo_texto, ativo, variaveis_disponiveis
  ) VALUES (
    p_tenant_id,
    'BEM_VINDO',
    'Padrão - Boas-vindas',
    'Mensagem de boas-vindas para novos usuários',
    '🎉 Bem-vindo(a) ao {{nome_empresa}}!',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { padding: 30px 20px; }
    .welcome-banner { text-align: center; padding: 30px 0; }
    .welcome-banner .emoji { font-size: 64px; margin-bottom: 20px; }
    .features { margin: 30px 0; }
    .feature { display: flex; align-items: flex-start; margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; }
    .feature-icon { font-size: 24px; margin-right: 15px; }
    .feature-content h3 { margin: 0 0 5px 0; color: #667eea; }
    .feature-content p { margin: 0; font-size: 14px; color: #666; }
    .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Bem-vindo(a) ao SupriFlow!</h1>
    </div>

    <div class="content">
      <div class="welcome-banner">
        <div class="emoji">👋</div>
        <h2 style="color: #667eea; margin: 0;">Olá, {{usuario_nome}}!</h2>
        <p style="color: #666; margin: 10px 0 0 0;">Estamos felizes em tê-lo(a) conosco</p>
      </div>

      <p>Você agora faz parte da equipe de <strong>{{nome_empresa}}</strong> e tem acesso ao nosso sistema completo de gestão de compras e suprimentos.</p>

      <div class="features">
        <div class="feature">
          <div class="feature-icon">📋</div>
          <div class="feature-content">
            <h3>Requisições de Compra</h3>
            <p>Solicite produtos e acompanhe aprovações em tempo real</p>
          </div>
        </div>

        <div class="feature">
          <div class="feature-icon">💰</div>
          <div class="feature-content">
            <h3>Cotações Inteligentes</h3>
            <p>Envie cotações e compare propostas dos fornecedores</p>
          </div>
        </div>

        <div class="feature">
          <div class="feature-icon">📦</div>
          <div class="feature-content">
            <h3>Controle de Estoque</h3>
            <p>Monitore níveis, movimentações e alertas automáticos</p>
          </div>
        </div>

        <div class="feature">
          <div class="feature-icon">📊</div>
          <div class="feature-content">
            <h3>Relatórios e Análises</h3>
            <p>Dashboards e relatórios completos para tomada de decisão</p>
          </div>
        </div>
      </div>

      <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>🎯 Primeiros Passos:</strong>
        <ol style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>Complete seu perfil pessoal</li>
          <li>Explore o dashboard principal</li>
          <li>Consulte a documentação de ajuda</li>
        </ol>
      </div>

      <div style="text-align: center;">
        <a href="https://app.supriflow.com.br/dashboard" class="button">
          Acessar o Sistema
        </a>
      </div>

      <p style="font-size: 13px; color: #666; margin-top: 30px;">
        Precisa de ajuda? Nossa equipe de suporte está à disposição para auxiliá-lo(a).
      </p>
    </div>

    <div class="footer">
      <p><strong>{{nome_empresa}}</strong></p>
      <p>E-mail de acesso: {{email}}</p>
      <p style="margin-top: 10px;">SupriFlow - Sistema de Gestão de Compras</p>
    </div>
  </div>
</body>
</html>',
    'BEM-VINDO(A) AO SUPRIFLOW!

Olá, {{usuario_nome}}!

Você agora faz parte da equipe de {{nome_empresa}} e tem acesso ao nosso sistema completo de gestão de compras e suprimentos.

FUNCIONALIDADES DISPONÍVEIS:
- Requisições de Compra
- Cotações Inteligentes
- Controle de Estoque
- Relatórios e Análises

PRIMEIROS PASSOS:
1. Complete seu perfil pessoal
2. Explore o dashboard principal
3. Consulte a documentação de ajuda

Acesse: https://app.supriflow.com.br/dashboard
E-mail: {{email}}

Bem-vindo(a) a bordo!
{{nome_empresa}}',
    true,
    '{"nome_empresa": "Nome da sua empresa", "usuario_nome": "Nome do usuário", "email": "E-mail do usuário"}'::jsonb
  ) ON CONFLICT (tenant_id, tipo) DO NOTHING;

  -- Template: Fatura Gerada
  INSERT INTO email_templates (
    tenant_id, tipo, nome, descricao, assunto, corpo_html, corpo_texto, ativo, variaveis_disponiveis
  ) VALUES (
    p_tenant_id,
    'FATURA_GERADA',
    'Padrão - Fatura Gerada',
    'Notificação de nova fatura de assinatura',
    '💳 Nova fatura gerada - {{nome_empresa}}',
    '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .invoice-box { background: #f8f9fa; border: 2px solid #3b82f6; padding: 25px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .invoice-value { font-size: 48px; font-weight: bold; color: #3b82f6; margin: 10px 0; }
    .invoice-due { color: #666; margin-top: 10px; }
    .button { display: inline-block; background: #3b82f6; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 20px 0; }
    .button:hover { background: #2563eb; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 Nova Fatura Disponível</h1>
    </div>

    <div class="content">
      <p>Olá, <strong>{{nome_empresa}}</strong>!</p>

      <p>Sua nova fatura de assinatura já está disponível para pagamento.</p>

      <div class="invoice-box">
        <div style="color: #666; text-transform: uppercase; font-size: 12px; font-weight: bold;">Valor da Fatura</div>
        <div class="invoice-value">{{valor}}</div>
        <div class="invoice-due">
          <strong>Vencimento:</strong> {{vencimento}}
        </div>
      </div>

      <div style="text-align: center;">
        <a href="{{link_pagamento}}" class="button">
          💳 Pagar Agora
        </a>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong>💡 Formas de Pagamento:</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
          <li>PIX (aprovação imediata)</li>
          <li>Cartão de Crédito</li>
          <li>Boleto Bancário</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #666;">
        Após o pagamento, sua assinatura será renovada automaticamente e você continuará com acesso total aos recursos do sistema.
      </p>
    </div>

    <div class="footer">
      <p><strong>{{nome_empresa}}</strong></p>
      <p>SupriFlow - Sistema de Gestão de Compras</p>
      <p style="margin-top: 10px;">Dúvidas? Entre em contato: suporte@supriflow.com.br</p>
    </div>
  </div>
</body>
</html>',
    'NOVA FATURA DISPONÍVEL

Olá, {{nome_empresa}}!

Sua nova fatura de assinatura já está disponível:

Valor: {{valor}}
Vencimento: {{vencimento}}

FORMAS DE PAGAMENTO:
- PIX (aprovação imediata)
- Cartão de Crédito
- Boleto Bancário

Acesse o link para pagar:
{{link_pagamento}}

SupriFlow
Sistema de Gestão de Compras',
    true,
    '{"nome_empresa": "Nome da sua empresa", "valor": "Valor formatado", "vencimento": "Data de vencimento", "link_pagamento": "Link para pagamento"}'::jsonb
  ) ON CONFLICT (tenant_id, tipo) DO NOTHING;

END;
$$;

-- Comentário
COMMENT ON FUNCTION criar_templates_padrao IS 'Cria templates de email padrão para um novo tenant';
