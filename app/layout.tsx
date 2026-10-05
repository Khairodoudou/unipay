import type { Metadata } from "next";
import { Noto_Sans_Arabic, Geist_Mono } from "next/font/google";
import "./globals.css";

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "UNI-PAY — منصة تسيير أجور موظفي الجامعة",
    template: "%s | UNI-PAY",
  },
  description:
    "UNI-PAY منصة رقمية متكاملة لتسيير ومعالجة أجور موظفي الجامعة — إعداد، تدقيق، مصادقة، رقابة ومتابعة.",
  keywords: ["UNI-PAY", "أجور", "جامعة", "كشف الرواتب", "تسيير الأجور"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${notoSansArabic.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
