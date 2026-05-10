'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientId = localStorage.getItem('client_id');
    if (clientId) {
      supabase
        .from('orders')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setOrders(data || []);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'confirmed': return 'status-confirmed';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'approved': return 'Подтверждён';
      case 'confirmed': return 'В работе';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменён';
      default: return 'Ожидает';
    }
  };

  if (loading) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">← На главную</Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">📋 Мои заказы</h1>
      
      {orders.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500">У вас пока нет заказов</p>
          <Link href="/" className="inline-block mt-4 text-blue-600 hover:underline">Создать заказ</Link>
        </div>
      )}
      
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-bold text-lg">{order.title}</h2>
              <span className={`status-badge ${getStatusClass(order.status)}`}>{getStatusText(order.status)}</span>
            </div>
            <p className="text-gray-600 text-sm mb-2">{order.description}</p>
            <p className="text-sm text-gray-500 mb-2">📍 {order.address}, {order.city}</p>
            <p className="text-xl font-bold text-blue-600 mt-2">{order.price} ₽</p>
            <p className="text-xs text-gray-400 mt-2">{new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
