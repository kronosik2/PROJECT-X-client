'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ResponsesList from './ResponsesList';

interface Order {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  status: string;
  worker_id: string | null;
  worker_name?: string;
  worker_phone?: string;
  created_at: string;
}

interface Props {
  userId: string;
  refreshKey: number;
}

export default function OrdersList({ userId, refreshKey }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [userId, refreshKey]);

  async function fetchOrders() {
    setLoading(true);

    // Получаем UUID клиента
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        worker:worker_id (name, phone)
      `)
      .eq('client_id', userData.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }

  async function confirmWorker(orderId: string) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) return;

    const { data, error } = await supabase.rpc('confirm_worker', {
      p_order_id: orderId,
      p_client_id: userData.id
    });

    if (error) {
      alert('Ошибка: ' + error.message);
    } else if (data?.success === false) {
      alert(data.error);
    } else {
      alert('Исполнитель подтверждён!');
      fetchOrders();
    }
  }

  async function completeOrder(orderId: string) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (!userData) return;

    const { data, error } = await supabase.rpc('complete_order', {
      p_order_id: orderId,
      p_client_id: userData.id
    });

    if (error) {
      alert('Ошибка: ' + error.message);
    } else if (data?.success === false) {
      alert(data.error);
    } else {
      alert('Заказ завершён!');
      fetchOrders();
    }
  }

  if (loading) return <div className="text-center py-4">Загрузка заказов...</div>;
  if (orders.length === 0) return <p className="text-gray-500 text-center py-4">У вас пока нет заказов</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Мои заказы</h2>
      
      {orders.map(order => (
        <div key={order.id} className="border rounded-lg p-4 shadow">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{order.title}</h3>
              <p className="text-gray-600">{order.description}</p>
              <p className="text-sm">📍 {order.address}</p>
              <p className="text-lg font-bold mt-1">{order.price} ₽</p>
              <p className="text-sm mt-1">
                Статус: <span className="font-bold">{order.status}</span>
              </p>
              
              {order.worker_id && order.worker && (
                <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                  <p>👤 Исполнитель: {order.worker.name || 'Без имени'} ({order.worker.phone})</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            {order.status === 'approved' && (
              <button
                onClick={() => confirmWorker(order.id)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Подтвердить исполнителя
              </button>
            )}
            
            {order.status === 'confirmed' && (
              <button
                onClick={() => completeOrder(order.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Завершить заказ
              </button>
            )}
          </div>
          
          {/* Отклики — только для pending заказов */}
          {order.status === 'pending' && (
            <ResponsesList orderId={order.id} onWorkerSelected={fetchOrders} />
          )}
        </div>
      ))}
    </div>
  );
}
