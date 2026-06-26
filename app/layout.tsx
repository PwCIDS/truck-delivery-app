import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Truck Delivery Management System',
  description: 'Comprehensive truck delivery management and tracking system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        {children}
      </body>
    </html>
  );
}
