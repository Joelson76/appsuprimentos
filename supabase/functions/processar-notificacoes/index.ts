// Edge Function para processar notificações pendentes
// Acionada por Database Webhook ou pg_cron

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar notificações pendentes
    const { data: notificacoes, error: notifError } = await supabaseAdmin
      .from('notificacoes_pendentes')
      .select('*')
      .eq('enviado', false)
      .limit(50) // Processar em lotes

    if (notifError) {
      console.error('Erro ao buscar notificações:', notifError)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar notificações' }),
        { status: 500 }
      )
    }

    if (!notificacoes || notificacoes.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma notificação pendente' }),
        { status: 200 }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@supriflow.com.br'

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY não configurado')
      return new Response(
        JSON.stringify({
          message: 'Notificações não enviadas (RESEND_API_KEY não configurado)',
        }),
        { status: 200 }
      )
    }

    const emailsEnviados: string[] = []

    for (const notif of notificacoes) {
      try {
        // Buscar tenant
        const { data: tenant } = await supabaseAdmin
          .from('tenants')
          .select('id, nome')
          .eq('id', notif.tenant_id)
          .single()

        if (!tenant) continue

        // Buscar usuários ADMIN e GESTOR
        const { data: usuarios } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('tenant_id', notif.tenant_id)
          .in('perfil', ['ADMIN', 'GESTOR', 'ALMOXARIFE'])
          .eq('ativo', true)

        if (!usuarios || usuarios.length === 0) continue

        // Buscar e-mails no auth.users
        const userIds = usuarios.map((u) => u.id)
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
        const destinatarios = authUsers.users
          .filter((u) => userIds.includes(u.id))
          .map((u) => u.email)
          .filter(Boolean)

        if (destinatarios.length === 0) continue

        let htmlContent = ''
        let subject = ''

        // Montar e-mail baseado no tipo
        switch (notif.tipo) {
          case 'ESTOQUE_MINIMO':
            subject = `⚠️ Alerta de Estoque Mínimo - ${tenant.nome}`
            const produtos = notif.payload as any[]

            const produtosHtml = produtos
              .map(
                (p) => `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${p.descricao}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd;">${p.estoque_atual}</td>
                <td style="padding: 10px; border-bottom: 1px solid #ddd; color: red;">${p.estoque_minimo}</td>
              </tr>
            `
              )
              .join('')

            htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; }
                  .header { background-color: #ef4444; color: white; padding: 20px; }
                  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                  th { background-color: #f4f4f4; padding: 10px; text-align: left; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>⚠️ Alerta de Estoque Mínimo</h1>
                </div>
                <h2>Olá ${tenant.nome},</h2>
                <p>Os seguintes produtos estão abaixo do estoque mínimo:</p>
                <table>
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Estoque Atual</th>
                      <th>Estoque Mínimo</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${produtosHtml}
                  </tbody>
                </table>
                <p>Acesse o SupriFlow para gerar requisições de compra.</p>
                <p>Atenciosamente,<br><strong>SupriFlow</strong></p>
              </body>
              </html>
            `
            break

          default:
            console.log(`Tipo de notificação desconhecido: ${notif.tipo}`)
            continue
        }

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
            subject,
            html: htmlContent,
          }),
        })

        if (resendResponse.ok) {
          // Marcar como enviado
          await supabaseAdmin
            .from('notificacoes_pendentes')
            .update({ enviado: true })
            .eq('id', notif.id)

          emailsEnviados.push(...destinatarios)
        } else {
          console.error(
            'Erro ao enviar e-mail:',
            await resendResponse.text()
          )
        }
      } catch (error) {
        console.error('Erro ao processar notificação:', error)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificacoesProcessadas: notificacoes.length,
        emailsEnviados: emailsEnviados.length,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Erro ao processar notificações:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar notificações' }),
      { status: 500 }
    )
  }
})
