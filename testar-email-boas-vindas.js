require('dotenv').config({ path: '.env.local' })

// Verificar se a API key está configurada
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY não está configurada no .env.local')
  console.log('\n📝 Para configurar:')
  console.log('1. Acesse https://resend.com/api-keys')
  console.log('2. Crie uma API key')
  console.log('3. Adicione no .env.local: RESEND_API_KEY=re_sua_chave')
  console.log('\n💡 Para testes, use: EMAIL_FROM=onboarding@resend.dev')
  process.exit(1)
}

const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

// Template inline (mesmo conteúdo do componente React)
const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Bem-vindo ao SupriFlow</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto;">
    <!-- Header -->
    <div style="background-color: #16a34a; padding: 30px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px;">SupriFlow</h1>
      <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 16px;">
        Bem-vindo ao futuro da gestão de compras!
      </p>
    </div>

    <!-- Corpo -->
    <div style="background-color: white; padding: 40px 30px; border-radius: 8px; margin: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">
        🎉 Conta criada com sucesso!
      </h2>

      <p style="color: #475569; line-height: 1.6; font-size: 16px;">
        Olá <strong>João Silva</strong>,
      </p>

      <p style="color: #475569; line-height: 1.6; font-size: 16px;">
        Ficamos muito felizes em ter a <strong>Empresa Teste LTDA</strong> como parte da comunidade SupriFlow!
        Sua conta foi criada com sucesso e já está pronta para uso.
      </p>

      <!-- Box de dados -->
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #16a34a;">
        <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 16px;">
          📋 Dados da sua conta:
        </h3>
        <p style="margin: 8px 0; color: #334155; font-size: 14px;">
          <strong>E-mail de acesso:</strong> teste@empresa.com.br
        </p>
        <p style="margin: 8px 0; color: #334155; font-size: 14px;">
          <strong>Empresa:</strong> Empresa Teste LTDA
        </p>
        <p style="margin: 8px 0; color: #334155; font-size: 14px;">
          <strong>Plano:</strong> PROFISSIONAL
        </p>
        <p style="margin: 8px 0; color: #334155; font-size: 14px;">
          <strong>Trial válido até:</strong> 26/06/2026
        </p>
      </div>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:3000"
           style="display: inline-block; background-color: #16a34a; color: white; padding: 14px 32px;
                  border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
          Acessar SupriFlow →
        </a>
      </div>

      <!-- Próximos passos -->
      <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px;">
        <h3 style="margin: 0 0 15px 0; color: #1e40af; font-size: 16px;">
          🚀 Próximos passos:
        </h3>
        <ol style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.8;">
          <li>Personalize as informações da sua empresa</li>
          <li>Cadastre seus fornecedores</li>
          <li>Crie sua primeira requisição de compra</li>
          <li>Envie cotações para seus fornecedores</li>
          <li>Gere pedidos de compra automaticamente</li>
        </ol>
      </div>

      <!-- Dica -->
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 25px; border-left: 4px solid #f59e0b;">
        <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">💡 Dica:</h3>
        <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
          Comece cadastrando seus fornecedores mais utilizados. Isso vai agilizar muito o processo de criação de cotações e pedidos!
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

      <!-- Suporte -->
      <div style="text-align: center;">
        <p style="color: #64748b; font-size: 14px; margin: 10px 0;">
          Precisa de ajuda? Estamos aqui para você!
        </p>
        <p style="color: #64748b; font-size: 14px; margin: 10px 0;">
          📧 suporte@supriflow.com.br
        </p>
      </div>

      <p style="color: #475569; margin-top: 30px; font-size: 15px;">
        Atenciosamente,<br>
        <strong>Equipe SupriFlow</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
      <p style="margin: 5px 0;">Este é um e-mail automático, por favor não responda.</p>
      <p style="margin: 5px 0;">© 2026 SupriFlow. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`

async function testar() {
  const emailTeste = process.argv[2]

  if (!emailTeste) {
    console.log('❌ Uso: node testar-email-boas-vindas.js <seu-email>')
    console.log('\nExemplo:')
    console.log('  node testar-email-boas-vindas.js joao@exemplo.com')
    return
  }

  console.log('📧 Enviando e-mail de boas-vindas de teste...\n')
  console.log(`De: ${process.env.EMAIL_FROM || 'onboarding@resend.dev'}`)
  console.log(`Para: ${emailTeste}`)
  console.log('\n⏳ Aguarde...\n')

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: emailTeste,
      subject: '🎉 Bem-vindo ao SupriFlow!',
      html: emailHtml,
    })

    if (error) {
      console.error('❌ Erro ao enviar e-mail:', error)

      if (error.message?.includes('Email address not verified')) {
        console.log('\n💡 Dica: Use EMAIL_FROM=onboarding@resend.dev para testes')
      }

      return
    }

    console.log('✅ E-mail enviado com sucesso!')
    console.log(`   ID: ${data.id}`)
    console.log('\n📊 Verifique o dashboard do Resend:')
    console.log('   https://resend.com/emails')
    console.log('\n📬 Verifique sua caixa de entrada (pode levar alguns segundos)')
  } catch (err) {
    console.error('❌ Erro:', err.message)
  }
}

testar()
