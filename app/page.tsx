'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import OrderForm from '@/components/OrderForm';
import AuthModal from '@/components/AuthModal';

export default function Home() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('client_id');
    if (saved) {
      supabase.from('clients').select('*').eq('id', saved).single()
        .then(({ data }) => {
          setClient(data);
          setLoading(false);
        });
    } else {
      setLoading(false);
      setShowAuthModal(true);
    }
  }, []);

  function handleLogin(client: any) {
    setClient(client);
    setShowAuthModal(false);
  }

  function handleLogout() {
    setClient(null);
    localStorage.removeItem('client_id');
    setShowAuthModal(true);
  }

  if (loading) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <>
      {showAuthModal && <AuthModal onLogin={handleLogin} />}
      
      {client && (
        <>
          <div className="hero">
            <div className="badge">🚚 Работаем с 2015 года</div>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-2">ПРОЕКТ X</h1>
            <p className="text-lg opacity-90">Грузчики за 10 минут · Без менеджеров</p>
            
            <div className="flex gap-4 justify-center mt-8 flex-wrap">
              <Link href="/PROJECT-X-client/" className="bg-white/20 backdrop-blur px-5 py-2 rounded-full hover:bg-white/30 transition">📝 Создать заказ</Link>
              <Link href="/PROJECT-X-client/orders/" className="bg-white/10 backdrop-blur px-5 py-2 rounded-full hover:bg-white/20 transition">📋 Мои заказы</Link>
              <button onClick={handleLogout} className="bg-red-500/20 backdrop-blur px-5 py-2 rounded-full hover:bg-red-500/30 transition">🚪 Выйти</button>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto px-4 pb-16">
            <div className="form-card">
              <OrderForm />
            </div>
          </div>
        </>
      )}
    </>
  );
}
