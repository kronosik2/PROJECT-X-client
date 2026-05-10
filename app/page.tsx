'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import OrderForm from '@/components/OrderForm';
import MyOrders from '@/components/MyOrders';

export default function ClientPage() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    // Временно: имитация входа по телефону
    const savedPhone = localStorage.getItem('client_phone');
    if (savedPhone) {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('phone', savedPhone)
        .single();
      if (data) setClient(data);
    }
    setLoading(false);
  }

  async function handleLogin() {
    const phone = prompt('Введите номер телефона:');
    if (!phone) return;
    
    // Проверяем, есть ли клиент
    let { data: existing } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (!existing) {
      // Создаём нового клиента
      const { data: newClient } = await supabase
        .from('clients')
        .insert({ phone, name: phone })
        .select()
        .single();
      existing = newClient;
    }
    
    if (existing) {
      setClient(existing);
      localStorage.setItem('client_phone', phone);
    }
  }

  function handleLogout() {
    setClient(null);
    localStorage.removeItem('client_phone');
  }

  if (loading) return <div className="p-4">Загрузка...</div>;

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">👋 ПРОЕКТ X</h1>
          <p className="mb-4">Вход для клиентов</p>
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Войти по телефону
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ПРОЕКТ X — Клиент</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{client.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            Выйти
          </button>
        </div>
      </div>

      <OrderForm clientId={client.id} onSuccess={() => setRefreshKey(prev => prev + 1)} />
      
      <div className="mt-8">
        <MyOrders clientId={client.id} refreshKey={refreshKey} />
      </div>
    </main>
  );
}
