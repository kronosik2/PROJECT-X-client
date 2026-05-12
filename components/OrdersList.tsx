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
    
    const cacheKey = `orders_${clientId}`;
    const cached = localStorage.getItem(cacheKey);
    const cachedTime = localStorage.getItem(`${cacheKey}_time`);
    
    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < 30000) {
      setOrders(JSON.parse(cached));
      setLoading(false);
      fetchFreshOrders(clientId, cacheKey);
      return;
    }
    
    await fetchFreshOrders(clientId, cacheKey);
  }
  
  async function fetchFreshOrders(clientId: string, cacheKey: string) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error:', error);
      } else {
        setOrders(data || []);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function cancelOrder(orderId: string) {
    if (!confirm('Отменить заказ?')) return;
    
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);
    
    await loadOrders();
    alert('✅ Заказ отменён');
  }

  async function completeOrder(orderId: string) {
    if (!confirm('Подтверждаете выполнение заказа?')) return;
    
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId);
    
    await loadOrders();
    alert('✅ Заказ завершён!');
  }

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
      case 'pending': return '⏳ Набор исполнителей';
      case 'approved': return '👷 Утверждён';
      case 'confirmed': return '🚚 В работе';
      case 'completed': return '✅ Выполнен';
      case 'cancelled': return '❌ Отменён';
      default: return 'Ожидает';
    }
  };

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
            <span className={`status-badge ${getStatusClass(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2">{order.description}</p>
          <p className="text-sm text-gray-500 mb-2">📍 {order.address}, {order.city}</p>
          <p className="text-lg font-bold text-blue-600">{order.price} ₽</p>
          <p className="text-sm text-gray-500">👥 Нужно: {order.workers_count} чел.</p>
          
          <div className="flex gap-3 mt-4">
            {order.status === 'pending' && (
              <button
                onClick={() => cancelOrder(order.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
              >
                ❌ Отменить заказ
              </button>
            )}
            {order.status === 'confirmed' && (
              <button
                onClick={() => completeOrder(order.id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
              >
                ✅ Подтвердить выполнение
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
