import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '我的双学期选课拼图 | 2026–2027学年',
  description: '国科大南京学院2026–2027学年秋春双学期选课、分学期学分与时间冲突规划工具',
  openGraph: {
    title: '我的双学期选课拼图',
    description: '2026–2027 秋春双学期 · 分学期规划学分与课表',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '我的选课拼图' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '我的双学期选课拼图',
    description: '2026–2027 秋春双学期 · 分学期规划学分与课表',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
