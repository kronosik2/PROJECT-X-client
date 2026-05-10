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

  if (loading) return <div className="p-8 text-center">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-6">
        <Link href="/" className="text-blue-600 hover:underline">← На главную</Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">📋 Мои заказы</h1>
      
      {orders.length === 0 && (
        <p className="text-gray-500 text-center py-8">У вас пока нет заказов</p>
      )}
      
      {orders.map(order => {
        const statusColors: Record<string, string> = {
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-blue-100 text-blue-800',
          confirmed: 'bg-purple-100 text-purple-800',
          completed: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800'
        };
        const statusText: Record<string, string> = {
          pending: 'Ожидает',
          approved: 'Подтверждён',
          confirmed: 'В работе',
          completed: 'Выполнен',
          cancelled: 'Отменён'
        };
        return (
          <div key={order.id} className="border rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-bold text-lg">{order.title}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                {statusText[order.status]}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-2">{order.description}</p>
            <p className="text-sm text-gray-500">📍 {order.address}, {order.city}</p>
            <p className="font-bold text-blue-600 mt-2">{order.price} ₽</p>
          </div>
        );
      })}
    </div>
  );
}
