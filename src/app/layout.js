import './globals.css';
import 'leaflet/dist/leaflet.css';

export const metadata = {
  title: 'TransUm Bandung — Dashboard Koridor 5',
  description: 'Dashboard IoT Penghitung Penumpang Halte — Metro Jabar Trans Koridor 5: UNPAD Dipatiukur ke UNPAD Jatinangor. Visualisasi real-time kepadatan halte.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  );
}
