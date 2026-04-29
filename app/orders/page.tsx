'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ResponsesList from '@/components/ResponsesList';

export default function OrdersPage() {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    if (!phone || phone.length < 6) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('client_phone', phone)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setOrders(data);
    }
    setLoading(false);
  };

  const activeOrders = orders.filter(o => o.status === 'open' || o.status === 'in_progress');
  const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>📋 Мои заказы</h1>
      
      {/* Ввод телефона */}
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
          {/* Табы */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button onClick={() => setActiveTab('active')} style={{ flex: 1, padding: '12px', borderRadius: '40px', border: 'none', background: activeTab === 'active' ? '#0f172a' : '#e2e8f0', color: activeTab === 'active' ? 'white' : '#0f172a', cursor: 'pointer' }}>
              🔄 Активные ({activeOrders.length})
            </button>
            <button onClick={() => setActiveTab('history')} style={{ flex: 1, padding: '12px', borderRadius: '40px', border: 'none', background: activeTab === 'history' ? '#0f172a' : '#e2e8f0', color: activeTab === 'history' ? 'white' : '#0f172a', cursor: 'pointer' }}>
              📜 История ({historyOrders.length})
            </button>
          </div>

          {/* Список заказов */}
          {(activeTab === 'active' ? activeOrders : historyOrders).map(order => (
            <div key={order.id} style={{ background: 'white', borderRadius: '24px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#64748b' }}>Заказ #{order.id.slice(0, 8)}</span>
                <span style={{ background: order.status === 'open' ? '#22c55e' : '#f59e0b', padding: '4px 12px', borderRadius: '40px', fontSize: '12px', color: 'white' }}>
                  {order.status === 'open' ? '🔍 Ищем исполнителя' : '🚚 В работе'}
                </span>
              </div>
              <p><strong>📍 {order.address}</strong></p>
              <p style={{ color: '#475569', fontSize: '14px', marginTop: '8px' }}>{order.work_description}</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>📅 {new Date(order.time_slot).toLocaleString()}</p>
              
              {/* Кнопка показать отклики */}
              {order.status === 'open' && (
                <button onClick={() => setSelectedOrderId(selectedOrderId === order.id ? null : order.id)} style={{ marginTop: '16px', padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '40px', cursor: 'pointer' }}>
                  {selectedOrderId === order.id ? '🙈 Скрыть отклики' : '👀 Посмотреть отклики исполнителей'}
                </button>
              )}
              
              {/* Отклики */}
              {selectedOrderId === order.id && (
                <ResponsesList orderId={order.id} />
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
