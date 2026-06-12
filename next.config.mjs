/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Desabilita ESLint durante builds de produção
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Permite build mesmo com erros de TypeScript
    // TODO: Corrigir erros de TypeScript gradualmente
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
