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
  const [responses, setResponses] = useState<Record<string, any[]>>({});
  const [selectedWorkers, setSelectedWorkers] = useState<Record<string, number>>({});

  useEffect(() => {
    loadOrders();
  }, [clientId, refreshKey]);

  async function loadOrders() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    setOrders(data || []);
    
    const pendingOrders = (data || []).filter(o => o.status === 'pending');
    
    for (let i = 0; i < pendingOrders.length; i++) {
      await loadResponses(pendingOrders[i].id);
      await loadSelectedCount(pendingOrders[i].id);
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
        is_selected,
        is_rejected,
        created_at,
        workers_count,
        worker:workers (id, name, phone, rating)
      `)
      .eq('order_id', orderId)
      .in('status', ['pending', 'approved']);
    
    if (data) {
      setResponses(prev => ({ ...prev, [orderId]: data }));
    }
  }

  async function loadSelectedCount(orderId: string) {
    const { data } = await supabase
      .from('orders')
      .select('selected_workers_count')
      .eq('id', orderId)
      .single();
    if (data) {
      setSelectedWorkers(prev => ({ ...prev, [orderId]: data.selected_workers_count || 0 }));
    }
  }

  async function selectResponse(responseId: string, orderId: string, workersCount: number) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const newTotal = (selectedWorkers[orderId] || 0) + workersCount;
    
    if (newTotal > order.workers_count) {
      alert(`Нельзя выбрать больше ${order.workers_count} человек. Сейчас выбрано ${selectedWorkers[orderId] || 0}`);
      return;
    }
    
    await supabase
      .from('responses')
      .update({ is_selected: true, status: 'approved' })
      .eq('id', responseId);
    
    await supabase
      .from('orders')
      .update({ selected_workers_count: newTotal })
      .eq('id', orderId);
    
    setSelectedWorkers(prev => ({ ...prev, [orderId]: newTotal }));
    await loadResponses(orderId);
    
    if (newTotal >= order.workers_count) {
      alert(`✅ Набрано ${newTotal} из ${order.workers_count} человек! Можно утверждать заказ.`);
    }
  }

  async function rejectResponse(responseId: string, orderId: string) {
    await supabase
      .from('responses')
      .update({ is_rejected: true, status: 'rejected' })
      .eq('id', responseId);
    
    await loadResponses(orderId);
  }

  async function approveOrder(orderId: string) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if ((selectedWorkers[orderId] || 0) < order.workers_count) {
      alert(`Недостаточно исполнителей. Нужно ${order.workers_count}, выбрано ${selectedWorkers[orderId] || 0}`);
      return;
    }
    
    await supabase
      .from('orders')
      .update({ status: 'approved' })
      .eq('id', orderId);
    
    for (const resp of responses[orderId] || []) {
      if (!resp.is_selected && !resp.is_rejected) {
        await supabase
          .from('responses')
          .update({ status: 'rejected' })
          .eq('id', resp.id);
      }
    }
    
    alert('✅ Заказ утверждён! Исполнители уведомлены.');
    await loadOrders();
  }

  async function cancelOrder(orderId: string) {
    if (!confirm('Отменить заказ? Все отклики будут удалены.')) return;
    
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);
    
    await supabase.from('responses').delete().eq('order_id', orderId);
    
    alert('✅ Заказ отменён');
    await loadOrders();
  }

  async function confirmCompletion(orderId: string) {
    if (!confirm('Подтверждаете выполнение заказа?')) return;
    
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId);
    
    alert('✅ Заказ завершён!');
    await loadOrders();
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

  if (loading) return <div className="text-center py-20">Загрузка заказов...</div>;

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
            <span className={`status-badge ${getStatusClass(order.status)}`}>{getStatusText(order.status)}</span>
          </div>
          <p className="text-gray-600 text-sm mb-2">{order.description}</p>
          <p className="text-sm text-gray-500 mb-2">📍 {order.address}, {order.city}</p>
          <p className="text-lg font-bold text-blue-600">{order.price} ₽</p>
          <p className="text-sm text-gray-500">👥 Нужно: {order.workers_count} чел.</p>
          <p className="text-sm text-green-600 mt-1">✅ Выбрано: {selectedWorkers[order.id] || 0} чел.</p>
          
          {order.status === 'pending' && responses[order.id]?.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="font-semibold text-sm mb-2">📢 Отклики:</p>
              <div className="space-y-2">
                {responses[order.id].map((resp: any) => {
                  if (resp.is_rejected) return null;
                  return (
                    <div key={resp.id} className={`p-3 rounded-lg flex justify-between items-center ${resp.is_selected ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                      <div className="text-sm">
                        <p className="font-medium">{resp.worker?.name || 'Исполнитель'}</p>
                        <p className="text-gray-500">⭐ {resp.worker?.rating || 5}</p>
                        <p className="text-green-600 font-bold">💰 {resp.price_offer} ₽</p>
                        <p className="text-gray-400 text-xs">👥 {resp.workers_count || 1} чел.</p>
                        {resp.comment && <p className="text-gray-400 text-xs">💬 {resp.comment}</p>}
                      </div>
                      <div className="flex gap-2">
                        {!resp.is_selected ? (
                          <>
                            <button
                              onClick={() => selectResponse(resp.id, order.id, resp.workers_count || 1)}
                              className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                            >
                              ✔ Выбрать
                            </button>
                            <button
                              onClick={() => rejectResponse(resp.id, order.id)}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
                            >
                              ✖ Отклонить
                            </button>
                          </>
                        ) : (
                          <span className="text-green-600 text-sm font-semibold">✓ Выбран</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex gap-3 mt-4">
            {order.status === 'pending' && (
              <>
                <button
                  onClick={() => approveOrder(order.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  ✅ Утвердить заказ
                </button>
                <button
                  onClick={() => cancelOrder(order.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                >
                  ❌ Отменить
                </button>
              </>
            )}
            {order.status === 'confirmed' && (
              <button
                onClick={() => confirmCompletion(order.id)}
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
