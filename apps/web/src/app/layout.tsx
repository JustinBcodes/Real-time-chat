import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '../components/auth/AuthProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Real-time Chat & Video Platform',
  description: 'A modern real-time chat and video calling platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
} 