import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';

// Display: Geométrico e impactante para headlines
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Body: Serifada editorial para textos (sofisticação)
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SupriFlow - Gestão de Compras e Suprimentos",
  description: "Sistema Completo de Gestão de Compras e Suprimentos para Indústria e Varejo",
  // Next.js detecta automaticamente app/icon.jpg como favicon
};

export const viewport: Viewport = {
  themeColor: "#10b981", // Verde esmeralda (emerald-600)
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexSerif.variable} antialiased`}
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
