import type { Metadata } from 'next';
import './globals.css';

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
      <body>
        {children}
      </body>
    </html>
  );
}