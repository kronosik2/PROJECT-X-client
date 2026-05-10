'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [responses, setResponses] = useState<Record<string, any[]>>({});
  const [ratingModal, setRatingModal] = useState<{ show: boolean; orderId: string; workerId: string }>({ show: false, orderId: '', workerId: '' });
  const [ratingScore, setRatingScore] = useState(5);

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
    
    // Загружаем отклики для каждого заказа со статусом pending
    for (const order of data || []) {
      if (order.status === 'pending') {
        await loadResponses(order.id);
      }
    }
    setLoading(false);
  }

  async function loadResponses(orderId: string) {
    const { data } = await supabase
      .from('responses')
      .select(`
        id,
        price_offer,
        comment,
        hold_amount,
        status,
        created_at,
        worker:workers (id, name, phone, rating)
      `)
      .eq('order_id', orderId)
      .eq('status', 'pending');
    
    if (data) {
      setResponses(prev => ({ ...prev, [orderId]: data }));
    }
  }

  async function selectResponse(responseId: string, orderId: string) {
    if (!confirm('Выбрать этого исполнителя? Остальные отклики будут отклонены.')) return;
    
    const { data, error } = await supabase.rpc('select_response', {
      p_response_id: responseId
    });
    
    if (error) {
      alert('Ошибка: ' + error.message);
    } else if (data?.success === false) {
      alert(data.error);
    } else {
      alert('✅ Исполнитель выбран. Ожидайте подтверждения.');
      const clientId = localStorage.getItem('client_id');
      if (clientId) loadOrders(clientId);
    }
  }

  async function cancelOrder(orderId: string) {
    if (!confirm('Отменить заказ? Все отклики будут удалены.')) return;
    
    const clientId = localStorage.getItem('client_id');
    const { error } = await supabase.rpc('cancel_order', {
      p_order_id: orderId,
      p_user_id: clientId,
      p_role: 'client',
      p_reason: 'Отменён клиентом'
    });
    
    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      alert('✅ Заказ отменён');
      if (clientId) loadOrders(clientId);
    }
  }

  async function confirmCompletion(orderId: string) {
    if (!confirm('Подтверждаете выполнение заказа?')) return;
    
    const clientId = localStorage.getItem('client_id');
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
      setRatingModal({ show: true, orderId: orderId, workerId: '' });
      const clientId = localStorage.getItem('client_id');
      if (clientId) loadOrders(clientId);
    }
  }

  async function submitRating() {
    // Получаем worker_id из заказа
    const order = orders.find(o => o.id === ratingModal.orderId);
    if (!order || !order.worker_id) return;
    
    const clientId = localStorage.getItem('client_id');
    const { error } = await supabase.rpc('add_rating', {
      p_order_id: ratingModal.orderId,
      p_from_id: clientId,
      p_to_id: order.worker_id,
      p_role_from: 'client',
      p_role_to: 'worker',
      p_score: ratingScore
    });
    
    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      alert('✅ Спасибо за оценку!');
    }
    setRatingModal({ show: false, orderId: '', workerId: '' });
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
    
    // Удаляем все отклики при редактировании
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
      time_slot: editingOrder.time_slot,
      workers_count: editingOrder.workers_count
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
      case 'pending': return '⏳ Ожидает исполнителей';
      case 'approved': return '👷 Исполнитель выбран, ожидает подтверждения';
      case 'confirmed': return '🚚 В работе';
      case 'completed': return '✅ Выполнен';
      case 'cancelled': return '❌ Отменён';
      default: return 'Ожидает';
    }
  };

  if (loading) return <div className="text-center py-20">Загрузка...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
      
      <div className="space-y-6">
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
                    <option value="shift">Смена</option>
                  </select>
                  <input
                    type="number"
                    className="flex-1 p-2 border rounded-lg"
                    value={editingOrder.price || ''}
                    onChange={(e) => setEditingOrder({...editingOrder, price: parseInt(e.target.value)})}
                    placeholder="Цена"
                  />
                  <input
                    type="number"
                    className="w-24 p-2 border rounded-lg"
                    value={editingOrder.workers_count || 1}
                    onChange={(e) => setEditingOrder({...editingOrder, workers_count: parseInt(e.target.value)})}
                    placeholder="Чел"
                    min="1"
                  />
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
                <p className="text-lg font-bold text-blue-600 mt-2">{order.price} ₽</p>
                <p className="text-sm text-gray-500">👥 Требуется: {order.workers_count || 1} чел.</p>
                
                {/* Отклики */}
                {order.status === 'pending' && responses[order.id]?.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <p className="font-semibold text-sm mb-2">📢 Отклики ({responses[order.id].length}):</p>
                    <div className="space-y-2">
                      {responses[order.id].map((resp: any) => (
                        <div key={resp.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                          <div className="text-sm">
                            <p className="font-medium">{resp.worker?.name || 'Исполнитель'}</p>
                            <p className="text-gray-500">⭐ {resp.worker?.rating || 5}</p>
                            <p className="text-green-600 font-bold">💰 {resp.price_offer} ₽</p>
                            {resp.comment && <p className="text-gray-400 text-xs">💬 {resp.comment}</p>}
                          </div>
                          <button
                            onClick={() => selectResponse(resp.id, order.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                          >
                            Выбрать
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Кнопки действий */}
                <div className="flex gap-3 mt-4">
                  {order.status === 'pending' && (
                    <>
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
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => confirmCompletion(order.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                    >
                      ✅ Подтвердить выполнение
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Модалка оценки */}
      {ratingModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Оцените исполнителя</h3>
            <div className="flex gap-2 justify-center mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRatingScore(star)}
                  className={`text-3xl ${star <= ratingScore ? 'text-yellow-500' : 'text-gray-300'}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={submitRating} className="flex-1 bg-blue-600 text-white py-2 rounded-lg">Отправить</button>
              <button onClick={() => setRatingModal({ show: false, orderId: '', workerId: '' })} className="flex-1 bg-gray-300 py-2 rounded-lg">Пропустить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
