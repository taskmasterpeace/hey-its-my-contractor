import type { Metadata } from 'next';
import './globals.css';
import { MainLayout } from '@/components/layout/MainLayout';

export const metadata: Metadata = {
  title: 'Hey, It\'s My Contractor',
  description: 'AI-powered contractor management platform with AAD generation system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}