'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function OrdersPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, any[]>>({});

  const loadOrders = async () => {
    if (!phone || phone.length < 6) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('client_phone', phone)
      .order('created_at', { ascending: false });
    
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  const loadResponses = async (orderId: string) => {
    if (responses[orderId]) return;
    
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('order_id', orderId)
      .order('price_offer', { ascending: true });
    
    if (!error && data) {
      setResponses(prev => ({ ...prev, [orderId]: data }));
    }
  };

  const selectWorker = async (responseId: string, orderId: string) => {
    const { data, error } = await supabase.rpc('select_response', {
      p_response_id: responseId,
      p_order_id: orderId
    });
    
    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      alert('✅ Исполнитель выбран! С ним свяжутся');
      loadOrders(); // обновляем список
      setExpandedOrderId(null); // закрываем отклики
    }
  };

  const cancelOrder = async (orderId: string) => {
    const reason = prompt('Причина отмены:');
    if (!reason) return;
    
    const { data, error } = await supabase.rpc('cancel_order_by_client', {
      p_order_id: orderId,
      p_reason: reason
    });
    
    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      alert('✅ Заказ отменён');
      loadOrders();
    }
  };

  const activeOrders = orders.filter(o => o.status === 'open' || o.status === 'assigned' || o.status === 'in_progress');
  const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>📋 Мои заказы</h1>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <input
          type="tel"
          placeholder="Введите ваш телефон"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: '100%', padding: '14px', borderRadius: '40px', border: '1px solid #e2e8f0', marginBottom: '12px' }}
        />
        <button onClick={loadOrders} style={{ padding: '12px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '40px', cursor: 'pointer' }}>
          Загрузить заказы
        </button>
      </div>

      {loading && <p>Загрузка...</p>}

      {orders.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => setActiveTab('active')} style={{ flex: 1, padding: '12px', borderRadius: '40px', border: 'none', background: activeTab === 'active' ? '#0f172a' : '#e2e8f0', color: activeTab === 'active' ? 'white' : '#0f172a', cursor: 'pointer' }}>
              🔄 Активные ({activeOrders.length})
            </button>
            <button onClick={() => setActiveTab('history')} style={{ flex: 1, padding: '12px', borderRadius: '40px', border: 'none', background: activeTab === 'history' ? '#0f172a' : '#e2e8f0', color: activeTab === 'history' ? 'white' : '#0f172a', cursor: 'pointer' }}>
              📜 История ({historyOrders.length})
            </button>
          </div>

          {(activeTab === 'active' ? activeOrders : historyOrders).map(order => (
            <div key={order.id} style={{ background: 'white', borderRadius: '24px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>Заказ #{order.id.slice(0, 8)}</span>
                <span style={{ 
                  background: order.status === 'open' ? '#22c55e' : 
                             order.status === 'assigned' ? '#f59e0b' : 
                             order.status === 'in_progress' ? '#3b82f6' : '#ef4444',
                  padding: '4px 12px', borderRadius: '40px', fontSize: '12px', color: 'white' 
                }}>
                  {order.status === 'open' ? '🔍 Ищем исполнителя' : 
                   order.status === 'assigned' ? '👷 Исполнитель назначен' :
                   order.status === 'in_progress' ? '🚚 В работе' : '❌ Отменён'}
                </span>
              </div>
              <p><strong>📍 {order.address}</strong></p>
              <p style={{ color: '#475569', fontSize: '14px', marginTop: '8px' }}>{order.work_description}</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>📅 {new Date(order.time_slot).toLocaleString()}</p>
              
              {order.status === 'open' && (
                <>
                  <button 
                    onClick={() => {
                      if (expandedOrderId === order.id) {
                        setExpandedOrderId(null);
                      } else {
                        setExpandedOrderId(order.id);
                        loadResponses(order.id);
                      }
                    }} 
                    style={{ marginTop: '16px', padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '40px', cursor: 'pointer' }}
                  >
                    {expandedOrderId === order.id ? '🙈 Скрыть отклики' : '👀 Посмотреть отклики'}
                  </button>
                  
                  <button 
                    onClick={() => cancelOrder(order.id)}
                    style={{ marginTop: '16px', marginLeft: '12px', padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '40px', cursor: 'pointer' }}
                  >
                    ❌ Отменить заказ
                  </button>
                </>
              )}
              
              {expandedOrderId === order.id && responses[order.id] && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ marginBottom: '12px' }}>📢 Отклики исполнителей:</h4>
                  {responses[order.id].length === 0 && <p>🤔 Пока никто не откликнулся</p>}
                  {responses[order.id].map(r => (
                    <div key={r.id} style={{ background: '#f8fafc', borderRadius: '20px', padding: '16px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '48px', height: '48px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                          {r.worker_photo || '👷'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{r.worker_name}</div>
                          <div style={{ fontSize: '12px', color: '#f59e0b' }}>⭐ {r.worker_rating} / 5</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#22c55e', marginTop: '4px' }}>💰 {r.price_offer} ₽</div>
                          {r.comment && <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>📝 {r.comment}</div>}
                        </div>
                        <button 
                          onClick={() => selectWorker(r.id, order.id)}
                          style={{ padding: '8px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '40px', cursor: 'pointer' }}
                        >
                          Выбрать
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
