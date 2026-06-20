export function gerarHTMLImpressao(
  titulo: string,
  colunas: string[],
  linhas: string[][],
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titulo}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; font-size: 14px; }
        th { background-color: #667eea; color: white; }
        tr:hover { background-color: #f5f5f5; }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${titulo}</h1>
      <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
      <table>
        <thead>
          <tr>
            ${colunas.map(col => `<th>${col}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${linhas.map(linha => `
            <tr>
              ${linha.map(cel => `<td>${cel}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <br>
      <button onclick="window.print()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Imprimir</button>
    </body>
    </html>
  `
}

export function abrirJanelaImpressao(html: string): boolean {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    return false
  }

  printWindow.document.write(html)
  printWindow.document.close()
  return true
}
