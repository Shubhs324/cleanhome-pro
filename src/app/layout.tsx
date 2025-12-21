import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "CleanHome Pro - Assistant Ménage",
  description: "Gérez vos 100 tâches de nettoyage avec rappels intelligents",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body>
        {children}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(reg => console.log('✅ SW enregistré'))
                  .catch(err => console.log('❌ SW erreur:', err));
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
