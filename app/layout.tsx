import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quiz - Descubra como fazer sua ex sentir sua falta",
  description:
    "Descubra como fazer sua ex sentir sua falta em 60 segundos com uma mensagem psicológica.",
};

import NextAuthProvider from "@/components/providers/NextAuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://cdn.utmify.com.br" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
        <Script id="utmify-pixel" strategy="afterInteractive">
          {`
            window.pixelId = "66b4ed3b88437ee533f62d0d";
            var a = document.createElement("script");
            a.setAttribute("async", "");
            a.setAttribute("defer", "");
            a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
            document.head.appendChild(a);
          `}
        </Script>
        <Script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-subids
          strategy="afterInteractive"
        />
        <Script id="utmify-google-pixel" strategy="afterInteractive">
          {`
            window.googlePixelId = "67df4a14b9a8899c7e1b76ed";
            var b = document.createElement("script");
            b.setAttribute("async", "");
            b.setAttribute("defer", "");
            b.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel-google.js");
            document.head.appendChild(b);
          `}
        </Script>
      </body>
    </html>
  );
}
