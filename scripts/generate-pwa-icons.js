// Script para gerar ícones PWA
// Executar: node scripts/generate-pwa-icons.js

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="115" fill="url(#grad)"/>

  <!-- Icon - Shopping cart with check -->
  <g transform="translate(106, 106)">
    <!-- Cart -->
    <path d="M50 60 L70 200 L230 200 L250 60 Z"
          fill="none"
          stroke="white"
          stroke-width="20"
          stroke-linejoin="round"/>

    <!-- Wheels -->
    <circle cx="90" cy="260" r="20" fill="white"/>
    <circle cx="210" cy="260" r="20" fill="white"/>

    <!-- Check mark -->
    <path d="M 120 100 L 160 150 L 240 60"
          fill="none"
          stroke="white"
          stroke-width="25"
          stroke-linecap="round"
          stroke-linejoin="round"/>
  </g>

  <!-- Text -->
  <text x="256" y="420"
        font-family="Arial, sans-serif"
        font-size="80"
        font-weight="bold"
        fill="white"
        text-anchor="middle">SF</text>
</svg>
`

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public')

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  console.log('🎨 Gerando ícones PWA...\n')

  for (const size of sizes) {
    const outputPath = path.join(publicDir, `icon-${size}x${size}.png`)

    try {
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(outputPath)

      console.log(`✅ Gerado: icon-${size}x${size}.png`)
    } catch (error) {
      console.error(`❌ Erro ao gerar icon-${size}x${size}.png:`, error.message)
    }
  }

  // Gerar favicon
  try {
    await sharp(Buffer.from(svgIcon))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'))

    console.log('✅ Gerado: favicon.ico')
  } catch (error) {
    console.error('❌ Erro ao gerar favicon:', error.message)
  }

  console.log('\n🎉 Todos os ícones foram gerados com sucesso!')
  console.log('\n📝 Próximos passos:')
  console.log('1. Teste localmente: npm run dev')
  console.log('2. Abra o DevTools (F12) > Application > Manifest')
  console.log('3. Verifique os ícones e configurações')
  console.log('4. Deploy para produção')
}

generateIcons().catch(console.error)
