'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface OrdersListProps {
  clientId: string;
  refreshKey: number;
}

export default function OrdersList({ clientId, refreshKey }: OrdersListProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, [clientId, refreshKey]);

  async function loadOrders() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
    } else {
      setOrders(data || []);
    }
    
    setLoading(false);
  }

  if (loading) {
    return <div className="text-center py-20">Загрузка заказов...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center shadow-sm">
        <p className="text-gray-500">У вас пока нет заказов</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map(order => (
        <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <h2 className="font-bold text-lg">{order.title}</h2>
            <span className="status-badge status-pending">⏳ {order.status}</span>
          </div>
          <p className="text-gray-600 text-sm mb-2">{order.description}</p>
          <p className="text-sm text-gray-500 mb-2">📍 {order.address}, {order.city}</p>
          <p className="text-lg font-bold text-blue-600">{order.price} ₽</p>
          <p className="text-sm text-gray-500">👥 Нужно: {order.workers_count} чел.</p>
        </div>
      ))}
    </div>
  );
}
