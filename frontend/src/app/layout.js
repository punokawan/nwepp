import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata = {
  title: 'NWEPP — Nutrition Workforce Education & Placement Platform',
  description: 'Platform nasional untuk edukasi, sertifikasi, dan manajemen tenaga kerja gizi mendukung program Makan Bergizi Gratis (MBG).',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
