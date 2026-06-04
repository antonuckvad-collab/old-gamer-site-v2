import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OLD GAMER — Магазин видеоигр в Новосибирске | Консоли, диски, ремонт",
  description: "Магазин видеоигр OLD GAMER в Новосибирске — консоли PS5, Xbox Series X, Nintendo Switch, игровые диски, аксессуары. Ремонт консолей и трейд-ин. ТРЦ Континент, 3 этаж.",
  keywords: "магазин видеоигр Новосибирск, купить PS5 Новосибирск, Nintendo Switch, Xbox Series X, ремонт консолей",
  openGraph: {
    title: "OLD GAMER — Магазин видеоигр в Новосибирске",
    description: "Консоли, диски, аксессуары. Ремонт и трейд-ин. ТРЦ Континент, 3 этаж.",
    images: ["/assets/shop-1.jpg"],
    type: "website",
    locale: "ru_RU",
  },
  icons: { icon: "/assets/head.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
