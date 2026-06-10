// Edge Function para enviar alertas de vencimento de contratos
// Acionada por pg_cron ou manualmente

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar contratos vencendo
    const { data: contratos, error: contratosError } = await supabaseAdmin
      .from('contratos')
      .select(
        `
        *,
        fornecedores (razao_social),
        tenants (id, nome)
      `
      )
      .eq('status', 'VENCENDO')

    if (contratosError) {
      console.error('Erro ao buscar contratos:', contratosError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar contratos' }),
        { status: 500 }
      )
    }

    if (!contratos || contratos.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhum contrato vencendo' }),
        { status: 200 }
      )
    }

    // Agrupar por tenant
    const contratosPorTenant = contratos.reduce((acc: any, contrato: any) => {
      const tenantId = contrato.tenant_id
      if (!acc[tenantId]) {
        acc[tenantId] = {
          tenant: contrato.tenants,
          contratos: [],
        }
      }
      acc[tenantId].contratos.push(contrato)
      return acc
    }, {})

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@supriflow.com.br'

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY não configurado')
      return new Response(
        JSON.stringify({
          message: 'Alertas não enviados (RESEND_API_KEY não configurado)',
        }),
        { status: 200 }
      )
    }

    const emailsEnviados: string[] = []

    // Enviar e-mail para cada tenant
    for (const tenantId in contratosPorTenant) {
      const { tenant, contratos: contratosVencendo } =
        contratosPorTenant[tenantId]

      // Buscar usuários ADMIN e GESTOR do tenant
      const { data: usuarios } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('tenant_id', tenantId)
        .in('perfil', ['ADMIN', 'GESTOR'])
        .eq('ativo', true)

      if (!usuarios || usuarios.length === 0) continue

      // Buscar e-mails dos usuários no auth.users
      const userIds = usuarios.map((u) => u.id)
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      const destinatarios = authUsers.users
        .filter((u) => userIds.includes(u.id))
        .map((u) => u.email)
        .filter(Boolean)

      if (destinatarios.length === 0) continue

      // Montar HTML do e-mail
      const contratosHtml = contratosVencendo
        .map((c: any) => {
          const diasRestantes = Math.ceil(
            (new Date(c.fim).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
          return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${c.titulo}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${c.fornecedores.razao_social}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(c.fim).toLocaleDateString('pt-BR')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; color: ${diasRestantes <= 7 ? 'red' : 'orange'};">
              ${diasRestantes} dias
            </td>
          </tr>
        `
        })
        .join('')

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .header { background-color: #3b82f6; color: white; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background-color: #f4f4f4; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>⚠️ Alerta de Vencimento de Contratos</h1>
          </div>
          <h2>Olá ${tenant.nome},</h2>
          <p>Os seguintes contratos estão próximos do vencimento:</p>
          <table>
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Fornecedor</th>
                <th>Data de Vencimento</th>
                <th>Tempo Restante</th>
              </tr>
            </thead>
            <tbody>
              ${contratosHtml}
            </tbody>
          </table>
          <p>Acesse o SupriFlow para renovar ou tomar as providências necessárias.</p>
          <p>Atenciosamente,<br><strong>SupriFlow</strong></p>
        </body>
        </html>
      `

      // Enviar e-mail via Resend
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: emailFrom,
          to: destinatarios,
          subject: `⚠️ ${contratosVencendo.length} contrato(s) vencendo - ${tenant.nome}`,
          html: htmlContent,
        }),
      })

      if (resendResponse.ok) {
        emailsEnviados.push(...destinatarios)
      } else {
        console.error(
          'Erro ao enviar e-mail:',
          await resendResponse.text()
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        contratosProcessados: contratos.length,
        emailsEnviados: emailsEnviados.length,
        destinatarios: emailsEnviados,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Erro ao enviar alertas:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao enviar alertas' }),
      { status: 500 }
    )
  }
})
