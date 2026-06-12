interface PedidoEmailProps {
  fornecedorNome: string
  numeroPedido: string
  dataEmissao: string
  dataEntregaPrevista?: string
  condicaoPagamento?: string
  itens: Array<{
    descricao: string
    quantidade: number
    valorUnitario: number
    prazoEntrega?: number
  }>
  valorTotal: number
  observacoes?: string
}

export function PedidoFornecedorEmail({
  fornecedorNome,
  numeroPedido,
  dataEmissao,
  dataEntregaPrevista,
  condicaoPagamento,
  itens,
  valorTotal,
  observacoes,
}: PedidoEmailProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

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
          backgroundColor: '#16a34a',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ color: 'white', margin: 0 }}>SupriFlow</h1>
        <p style={{ color: '#dcfce7', margin: '5px 0 0 0', fontSize: '14px' }}>
          Pedido de Compra
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
          Novo Pedido de Compra
        </h2>

        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Olá <strong>{fornecedorNome}</strong>,
        </p>

        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Segue em anexo o pedido de compra para fornecimento dos itens
          listados abaixo.
        </p>

        <div
          style={{
            backgroundColor: '#f0fdf4',
            padding: '15px',
            borderRadius: '6px',
            marginTop: '20px',
            borderLeft: '4px solid #16a34a',
          }}
        >
          <p style={{ margin: '5px 0', color: '#334155' }}>
            <strong>Número do Pedido:</strong> {numeroPedido}
          </p>
          <p style={{ margin: '5px 0', color: '#334155' }}>
            <strong>Data de Emissão:</strong> {dataEmissao}
          </p>
          {dataEntregaPrevista && (
            <p style={{ margin: '5px 0', color: '#334155' }}>
              <strong>Data de Entrega Prevista:</strong> {dataEntregaPrevista}
            </p>
          )}
          {condicaoPagamento && (
            <p style={{ margin: '5px 0', color: '#334155' }}>
              <strong>Condição de Pagamento:</strong> {condicaoPagamento}
            </p>
          )}
        </div>

        <h3 style={{ color: '#1e293b', marginTop: '25px' }}>
          Itens do Pedido:
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
                Qtd
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
                Valor Unit.
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
                Total
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
                  {item.prazoEntrega && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#64748b',
                        marginTop: '2px',
                      }}
                    >
                      Prazo: {item.prazoEntrega} dias
                    </div>
                  )}
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
                <td
                  style={{
                    padding: '10px',
                    textAlign: 'right',
                    borderBottom: '1px solid #f1f5f9',
                    color: '#334155',
                  }}
                >
                  {formatCurrency(item.valorUnitario)}
                </td>
                <td
                  style={{
                    padding: '10px',
                    textAlign: 'right',
                    borderBottom: '1px solid #f1f5f9',
                    color: '#334155',
                    fontWeight: 'bold',
                  }}
                >
                  {formatCurrency(item.quantidade * item.valorUnitario)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <td
                colSpan={3}
                style={{
                  padding: '15px 10px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  borderTop: '2px solid #e2e8f0',
                }}
              >
                VALOR TOTAL:
              </td>
              <td
                style={{
                  padding: '15px 10px',
                  textAlign: 'right',
                  fontWeight: 'bold',
                  color: '#16a34a',
                  fontSize: '18px',
                  borderTop: '2px solid #e2e8f0',
                }}
              >
                {formatCurrency(valorTotal)}
              </td>
            </tr>
          </tfoot>
        </table>

        {observacoes && (
          <div
            style={{
              backgroundColor: '#fef3c7',
              padding: '15px',
              borderRadius: '6px',
              marginTop: '20px',
              borderLeft: '4px solid #f59e0b',
            }}
          >
            <h4
              style={{
                margin: '0 0 10px 0',
                color: '#92400e',
                fontSize: '14px',
              }}
            >
              Observações:
            </h4>
            <p style={{ margin: 0, color: '#78350f', whiteSpace: 'pre-wrap' }}>
              {observacoes}
            </p>
          </div>
        )}

        <div
          style={{
            backgroundColor: '#eff6ff',
            padding: '15px',
            borderRadius: '6px',
            marginTop: '25px',
          }}
        >
          <p
            style={{
              color: '#1e40af',
              fontSize: '14px',
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            <strong>Importante:</strong> Por favor, confirme o recebimento
            deste pedido e nos informe a previsão de entrega o mais breve
            possível.
          </p>
        </div>

        <p style={{ color: '#475569', marginTop: '25px' }}>
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
        <p style={{ margin: '5px 0' }}>
          © 2026 SupriFlow. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
