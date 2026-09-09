import React from 'react';
import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Cloud Library | Modern Digital Library System',
  description: 'Browse the digital book catalog, borrow titles online, and manage loans seamlessly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
