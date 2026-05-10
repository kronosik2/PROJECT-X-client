'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import OrderForm from '@/components/OrderForm';

export default function ClientPage() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('client_id');
    if (saved) {
      supabase.from('clients').select('*').eq('id', saved).single()
        .then(({ data }) => {
          setClient(data);
          if (data) fetchOrders(data.id);
        });
    }
    setLoading(false);
  }, [refreshKey]);

  async function fetchOrders(clientId: string) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  async function handleLogin() {
    const phone = prompt('Введите номер телефона:');
    if (!phone) return;

    let { data: existing } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', phone)
      .single();

    if (!existing) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({ phone, name: phone })
        .select()
        .single();
      existing = newClient;
    }

    if (existing) {
      setClient(existing);
      localStorage.setItem('client_id', existing.id);
      fetchOrders(existing.id);
    }
  }

  if (loading) return <div className="p-4">Загрузка...</div>;

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">ПРОЕКТ X</h1>
          <button onClick={handleLogin} className="bg-blue-600 text-white px-6 py-2 rounded">
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
        <button
          onClick={() => {
            setClient(null);
            localStorage.removeItem('client_id');
          }}
          className="text-red-600 text-sm"
        >
          Выйти
        </button>
      </div>

      <OrderForm clientId={client.id} onSuccess={() => setRefreshKey(prev => prev + 1)} />

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">📋 Мои заказы</h2>
        {orders.length === 0 && <p className="text-gray-500">У вас пока нет заказов</p>}
        {orders.map(order => (
          <div key={order.id} className="border rounded-lg p-4 mb-3">
            <h3 className="font-bold">{order.title}</h3>
            <p className="text-gray-600">{order.description}</p>
            <p className="text-sm">📍 {order.address}</p>
            <p className="font-bold mt-2">{order.price} ₽</p>
            <p className="text-sm">Статус: {order.status}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
