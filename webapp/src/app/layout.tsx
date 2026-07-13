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
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-thai bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
