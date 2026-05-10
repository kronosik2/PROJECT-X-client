'use client';

import { useEffect } from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Отключаем кэширование для старых браузеров, но включаем для современных
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    }
  }, []);

  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
