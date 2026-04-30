'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@clerk/nextjs';

type Order = {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  status: string;
  worker_id: string | null;
  created_at: string;
  worker?: {
    name: string;
    phone: string;
  };
};

export default function ClientOrdersPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrder, setNewOrder] = useState({ title: '', description: '', address: '', price: '' });

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  async function fetchOrders() {
    setLoading(true);
    
    // Получаем ID пользователя из таблицы users по clerk_id
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user?.id)
      .single();
    
    if (!userData) return;
    
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

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user?.id)
      .single();
    
    if (!userData) {
      alert('Пользователь не найден');
      return;
    }
    
    const { error } = await supabase.from('orders').insert({
      client_id: userData.id,
      title: newOrder.title,
      description: newOrder.description,
      address: newOrder.address,
      price: parseFloat(newOrder.price),
      status: 'pending'
    });
    
    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      setNewOrder({ title: '', description: '', address: '', price: '' });
      fetchOrders();
    }
  }

  async function confirmWorker(orderId: string) {
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user?.id)
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
      .eq('clerk_id', user?.id)
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

  if (loading) return <div className="p-4">Загрузка...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Мои заказы</h1>
      
      {/* Форма создания заказа */}
      <form onSubmit={createOrder} className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Новый заказ</h2>
        <input
          type="text"
          placeholder="Название"
          value={newOrder.title}
          onChange={(e) => setNewOrder({ ...newOrder, title: e.target.value })}
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <textarea
          placeholder="Описание"
          value={newOrder.description}
          onChange={(e) => setNewOrder({ ...newOrder, description: e.target.value })}
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="text"
          placeholder="Адрес"
          value={newOrder.address}
          onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
          className="w-full p-2 mb-2 border rounded"
        />
        <input
          type="number"
          placeholder="Цена"
          value={newOrder.price}
          onChange={(e) => setNewOrder({ ...newOrder, price: e.target.value })}
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Создать заказ
        </button>
      </form>
      
      {/* Список заказов */}
      {orders.length === 0 && <p>Нет заказов</p>}
      
      {orders.map((order) => (
        <div key={order.id} className="border rounded-lg p-4 mb-4 shadow">
          <h2 className="text-xl font-semibold">{order.title}</h2>
          <p className="text-gray-600">{order.description}</p>
          <p className="text-sm">📍 {order.address}</p>
          <p className="text-lg font-bold mt-2">{order.price} ₽</p>
          <p className="text-sm">
            Статус: <span className="font-bold">{order.status}</span>
          </p>
          
          {order.worker_id && (
            <div className="mt-2 p-2 bg-green-50 rounded">
              <p>Исполнитель: {order.worker?.name || 'Неизвестен'} ({order.worker?.phone})</p>
            </div>
          )}
          
          <div className="mt-3 flex gap-2">
            {order.status === 'approved' && (
              <button
                onClick={() => confirmWorker(order.id)}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Подтвердить исполнителя
              </button>
            )}
            
            {order.status === 'confirmed' && (
              <button
                onClick={() => completeOrder(order.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Завершить заказ
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
