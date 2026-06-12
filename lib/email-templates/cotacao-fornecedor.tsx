interface CotacaoEmailProps {
  fornecedorNome: string
  numeroCotacao: string
  dataLimite: string
  itens: Array<{
    descricao: string
    quantidade: number
  }>
  linkResposta: string
}

export function CotacaoFornecedorEmail({
  fornecedorNome,
  numeroCotacao,
  dataLimite,
  itens,
  linkResposta,
}: CotacaoEmailProps) {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#f9fafb',
      }}
    >
      <div
        style={{
          backgroundColor: '#2563eb',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: 'white', margin: 0 }}>SupriFlow</h1>
        <p style={{ color: '#e0e7ff', margin: '5px 0 0 0', fontSize: '14px' }}>
          Gestão de Compras e Suprimentos
        </p>
      </div>

      <div
        style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          margin: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h2 style={{ color: '#1e293b', marginTop: 0 }}>
          Nova Solicitação de Cotação
        </h2>

        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Olá <strong>{fornecedorNome}</strong>,
        </p>

        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Você recebeu uma nova solicitação de cotação da nossa empresa.
        </p>

        <div
          style={{
            backgroundColor: '#f1f5f9',
            padding: '15px',
            borderRadius: '6px',
            marginTop: '20px',
          }}
        >
          <p style={{ margin: '5px 0', color: '#334155' }}>
            <strong>Número da Cotação:</strong> {numeroCotacao}
          </p>
          <p style={{ margin: '5px 0', color: '#334155' }}>
            <strong>Data Limite para Resposta:</strong> {dataLimite}
          </p>
        </div>

        <h3 style={{ color: '#1e293b', marginTop: '25px' }}>
          Itens Solicitados:
        </h3>

        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '10px',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th
                style={{
                  padding: '10px',
                  textAlign: 'left',
                  borderBottom: '2px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '14px',
                }}
              >
                Descrição
              </th>
              <th
                style={{
                  padding: '10px',
                  textAlign: 'right',
                  borderBottom: '2px solid #e2e8f0',
                  color: '#475569',
                  fontSize: '14px',
                }}
              >
                Quantidade
              </th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item, index) => (
              <tr key={index}>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #f1f5f9',
                    color: '#334155',
                  }}
                >
                  {item.descricao}
                </td>
                <td
                  style={{
                    padding: '10px',
                    textAlign: 'right',
                    borderBottom: '1px solid #f1f5f9',
                    color: '#334155',
                  }}
                >
                  {item.quantidade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div
          style={{
            textAlign: 'center',
            marginTop: '30px',
          }}
        >
          <a
            href={linkResposta}
            style={{
              display: 'inline-block',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px 30px',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
            }}
          >
            Responder Cotação
          </a>
        </div>

        <p
          style={{
            color: '#64748b',
            fontSize: '14px',
            marginTop: '30px',
            lineHeight: 1.6,
          }}
        >
          Por favor, preencha os valores, prazos e condições de pagamento
          através do link acima até a data limite informada.
        </p>

        <p
          style={{
            color: '#64748b',
            fontSize: '14px',
            marginTop: '20px',
            lineHeight: 1.6,
          }}
        >
          Qualquer dúvida, entre em contato conosco.
        </p>

        <p style={{ color: '#475569', marginTop: '20px' }}>
          Atenciosamente,
          <br />
          <strong>Equipe de Compras</strong>
        </p>
      </div>

      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          color: '#94a3b8',
          fontSize: '12px',
        }}
      >
        <p style={{ margin: '5px 0' }}>
          Este é um e-mail automático, por favor não responda.
        </p>
        <p style={{ margin: '5px 0' }}>© 2026 SupriFlow. Todos os direitos reservados.</p>
      </div>
    </div>
  )
}
