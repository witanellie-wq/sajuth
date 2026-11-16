import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ดวงซาจู | ดูดวงสไตล์เกาหลี",
  description: "ดูดวงซาจู (사주) สไตล์เกาหลีจากวันเดือนปีเกิดของคุณ รู้ผลใน 1 นาที",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        {/* Thai + hanja display font. Self-host in production per CSP. */}
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <>
            <meta name="google-adsense-account" content={process.env.NEXT_PUBLIC_ADSENSE_CLIENT} />
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
              crossOrigin="anonymous"
            />
          </>
        )}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-thai bg-gradient-to-b from-pink-50 via-cream to-purple-50 text-ink antialiased min-h-screen">
        <a
          href="/me"
          className="fixed left-3 top-3 z-30 rounded-full border border-white/25 bg-black/30 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur"
        >
          👤 ดวงของฉัน
        </a>
        {children}
        <footer className="relative z-10 pb-8 text-center text-xs text-white/50">
          <a href="/me" className="underline">ดวงของฉัน · My readings</a>
          {" · "}
          <a href="/privacy" className="underline">นโยบายความเป็นส่วนตัว · Privacy</a>
        </footer>
      </body>
    </html>
  );
}
