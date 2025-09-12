'use client'

import { Inter, Orbitron, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-grotesk',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
  fallback: ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} ${orbitron.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased bg-gray-900 text-white`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
