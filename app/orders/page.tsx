'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  useEffect(() => {
    const clientId = localStorage.getItem('client_id');
    if (clientId) {
      loadOrders(clientId);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadOrders(clientId: string) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function cancelOrder(orderId: string) {
    if (!confirm('Отменить заказ? Все отклики будут удалены.')) return;
    
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);
    
    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      await supabase.from('responses').delete().eq('order_id', orderId);
      alert('✅ Заказ отменён');
      const clientId = localStorage.getItem('client_id');
      if (clientId) loadOrders(clientId);
    }
  }

  async function updateOrder(orderId: string, updatedData: any) {
    const { error } = await supabase
      .from('orders')
      .update(updatedData)
      .eq('id', orderId);
    
    if (error) {
      alert('Ошибка: ' + error.message);
      return false;
    }
    
    await supabase.from('responses').delete().eq('order_id', orderId);
    return true;
  }

  function handleEdit(order: any) {
    setEditingOrder(order);
  }

  async function saveEdit() {
    if (!editingOrder) return;
    
    const success = await updateOrder(editingOrder.id, {
      description: editingOrder.description,
      city: editingOrder.city,
      address: editingOrder.address,
      tariff: editingOrder.tariff,
      fixed_budget: editingOrder.fixed_budget,
      hourly_rate: editingOrder.hourly_rate,
      price: editingOrder.price,
      time_slot: editingOrder.time_slot
    });
    
    if (success) {
      alert('✅ Заказ обновлён, все отклики удалены');
      setEditingOrder(null);
      const clientId = localStorage.getItem('client_id');
      if (clientId) loadOrders(clientId);
    }
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
        <Link href="/PROJECT-X-client/" className="text-blue-600 hover:underline">← На главную</Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">📋 Мои заказы</h1>
      
      {orders.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <p className="text-gray-500">У вас пока нет заказов</p>
          <Link href="/PROJECT-X-client/" className="inline-block mt-4 text-blue-600 hover:underline">Создать заказ</Link>
        </div>
      )}
      
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            {editingOrder?.id === order.id ? (
              <div className="space-y-3">
                <textarea
                  className="w-full p-2 border rounded-lg"
                  value={editingOrder.description}
                  onChange={(e) => setEditingOrder({...editingOrder, description: e.target.value})}
                  rows={2}
                />
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={editingOrder.city}
                  onChange={(e) => setEditingOrder({...editingOrder, city: e.target.value})}
                  placeholder="Город"
                />
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={editingOrder.address}
                  onChange={(e) => setEditingOrder({...editingOrder, address: e.target.value})}
                  placeholder="Адрес"
                />
                <div className="flex gap-2">
                  <select
                    className="p-2 border rounded-lg"
                    value={editingOrder.tariff}
                    onChange={(e) => setEditingOrder({...editingOrder, tariff: e.target.value})}
                  >
                    <option value="fixed">Фикс-цена</option>
                    <option value="hourly">Почасовая</option>
                  </select>
                  {editingOrder.tariff === 'fixed' ? (
                    <input
                      type="number"
                      className="flex-1 p-2 border rounded-lg"
                      value={editingOrder.fixed_budget || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setEditingOrder({
                          ...editingOrder, 
                          fixed_budget: val,
                          price: val
                        });
                      }}
                      placeholder="Бюджет"
                    />
                  ) : (
                    <input
                      type="number"
                      className="flex-1 p-2 border rounded-lg"
                      value={editingOrder.hourly_rate || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setEditingOrder({
                          ...editingOrder, 
                          hourly_rate: val,
                          price: val * 4
                        });
                      }}
                      placeholder="Ставка за час"
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Сохранить</button>
                  <button onClick={() => setEditingOrder(null)} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600">Отмена</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="font-bold text-lg">{order.title}</h2>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>{getStatusText(order.status)}</span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{order.description}</p>
                <p className="text-sm text-gray-500 mb-2">📍 {order.address}, {order.city}</p>
                <p className="text-xl font-bold text-blue-600 mt-2">{order.price} ₽</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
                
                {order.status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      ❌ Отменить
                    </button>
                    <button
                      onClick={() => handleEdit(order)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      ✏️ Редактировать
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
