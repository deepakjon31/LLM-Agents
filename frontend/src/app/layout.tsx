import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from '@/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AI Chatbot',
  description: 'An AI chatbot with SQL and document capabilities',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <main className="min-h-screen">
            {children}
          </main>
          <Toaster position="top-right" />
        </SessionProvider>
      </body>
    </html>
  );
}
