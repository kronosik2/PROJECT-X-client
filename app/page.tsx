'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import OrderForm from '@/components/OrderForm';
import AuthModal from '@/components/AuthModal';
import OrdersList from '@/components/OrdersList';

export default function HomePage() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'orders'>('create');
  const [refreshKey, setRefreshKey] = useState(0);

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

  function refreshOrders() {
    setRefreshKey(prev => prev + 1);
  }

  if (loading) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <>
      {showAuthModal && <AuthModal role="client" onLogin={handleLogin} />}
      
      {client && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="hero">
            <div className="badge">🚚 Работаем с 2015 года</div>
            <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-2">ПРОЕКТ X</h1>
            <p className="text-lg opacity-90">Грузчики за 10 минут · Без менеджеров</p>
            
            <div className="flex gap-4 justify-center mt-8 flex-wrap">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-5 py-2 rounded-full transition ${
                  activeTab === 'create' 
                    ? 'bg-white text-blue-600 font-semibold' 
                    : 'bg-white/20 backdrop-blur hover:bg-white/30'
                }`}
              >
                📝 Создать заказ
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-5 py-2 rounded-full transition ${
                  activeTab === 'orders' 
                    ? 'bg-white text-blue-600 font-semibold' 
                    : 'bg-white/20 backdrop-blur hover:bg-white/30'
                }`}
              >
                📋 Мои заказы
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500/20 backdrop-blur px-5 py-2 rounded-full hover:bg-red-500/30 transition"
              >
                🚪 Выйти
              </button>
            </div>
          </div>
          
          <div className="max-w-2xl mx-auto px-4 pb-16">
            {activeTab === 'create' ? (
              <div className="form-card">
                <OrderForm clientId={client.id} onSuccess={refreshOrders} />
              </div>
            ) : (
              <OrdersList clientId={client.id} refreshKey={refreshKey} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
