'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  clientId: string;
  refreshKey: number;
}

export default function MyOrders({ clientId, refreshKey }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [clientId, refreshKey]);

  async function fetchOrders() {
    setLoading(true);
    
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        worker:worker_id (name, phone)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    setOrders(data || []);
    
    // Загружаем отклики для каждого pending заказа
    for (const order of data || []) {
      if (order.status === 'pending') {
        const { data: respData } = await supabase
          .from('responses')
          .select(`
            id,
            worker_id,
            price_offer,
            comment,
            status,
            created_at,
            workers:worker_id (name, phone, rating)
          `)
          .eq('order_id', order.id)
          .eq('status', 'pending');
        
        setResponses(prev => ({ ...prev, [order.id]: respData || [] }));
      }
    }
    
    setLoading(false);
  }

  async function selectResponse(responseId: string) {
    const { data, error } = await supabase.rpc('select_response', {
      p_response_id: responseId
    });
    
    if (error) {
      alert('Ошибка: ' + error.message);
    } else if (data?.success === false) {
      alert(data.error);
    } else {
      alert('✅ Исполнитель выбран!');
      fetchOrders();
    }
  }

  async function confirmCompletion(orderId: string) {
    if (!confirm('Подтверждаете выполнение заказа?')) return;
    
    const { data, error } = await supabase.rpc('complete_order', {
      p_order_id: orderId,
      p_user_id: clientId,
      p_role: 'client'
    });
    
    if (error) {
      alert('Ошибка: ' + error.message);
    } else if (data?.success === false) {
      alert(data.error);
    } else {
      alert('✅ Заказ завершён!');
      fetchOrders();
    }
  }

  function getStatusText(status: string) {
    const map: Record<string, string> = {
      pending: '⏳ Ожидает исполнителей',
      approved: '👷 Исполнитель выбран, ожидает подтверждения',
      confirmed: '🚚 В работе',
      completed: '✅ Завершён',
      cancelled: '❌ Отменён'
    };
    return map[status] || status;
  }

  if (loading) return <div className="text-center py-4">Загрузка заказов...</div>;
  if (orders.length === 0) return <p className="text-gray-500 text-center py-4">У вас пока нет заказов</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">📋 Мои заказы</h2>
      
      {orders.map(order => (
        <div key={order.id} className="border rounded-lg p-4 mb-4 shadow">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-lg">{order.title}</h3>
              <p className="text-gray-600">{order.description}</p>
              <p className="text-sm">📍 {order.address}</p>
              <p className="text-sm">📅 {new Date(order.time_slot).toLocaleString()}</p>
              <p className="font-bold mt-2">{order.price} ₽</p>
              <p className="text-sm mt-1">Статус: {getStatusText(order.status)}</p>
              
              {order.worker && order.status !== 'pending' && (
                <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                  👤 Исполнитель: {order.worker.name} ({order.worker.phone})
                </div>
              )}
            </div>
          </div>
          
          {/* Отклики (только для pending заказов) */}
          {order.status === 'pending' && responses[order.id]?.length > 0 && (
            <div className="mt-3 border-t pt-3">
              <p className="font-semibold mb-2">📢 Отклики исполнителей:</p>
              {responses[order.id].map((resp: any) => (
                <div key={resp.id} className="bg-gray-50 p-3 rounded mb-2 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{resp.workers?.name}</p>
                    <p className="text-sm text-gray-600">📞 {resp.workers?.phone}</p>
                    <p className="text-sm">⭐ {resp.workers?.rating || 5}</p>
                    <p className="text-sm font-bold">💰 {resp.price_offer} ₽</p>
                    {resp.comment && <p className="text-sm text-gray-500">💬 {resp.comment}</p>}
                  </div>
                  <button
                    onClick={() => selectResponse(resp.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Выбрать
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Кнопка завершения */}
          {order.status === 'confirmed' && (
            <button
              onClick={() => confirmCompletion(order.id)}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Подтвердить выполнение
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
