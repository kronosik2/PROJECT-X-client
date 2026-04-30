'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ResponsesList({ orderId }: { orderId: string }) {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResponses();
  }, [orderId]);

  const loadResponses = async () => {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setResponses(data);
    }
    setLoading(false);
  };

  const acceptResponse = async (responseId: string) => {
    // Принять отклик (выбрать исполнителя)
    await supabase
      .from('responses')
      .update({ status: 'accepted' })
      .eq('id', responseId);
    
    // Обновить статус заказа
    await supabase
      .from('orders')
      .update({ status: 'in_progress', selected_worker_id: responseId })
      .eq('id', orderId);
    
    alert('✅ Исполнитель выбран! Скоро он свяжется с вами');
    loadResponses();
  };

  if (loading) return <p>Загрузка откликов...</p>;
  if (responses.length === 0) return <p style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>🤔 Пока никто не откликнулся. Подождите немного...</p>;

  return (
    <div style={{ marginTop: '16px' }}>
      <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>📢 Отклики исполнителей:</h3>
      {responses.map(r => (
        <div key={r.id} style={{ background: '#f8fafc', borderRadius: '20px', padding: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', background: '#cbd5e1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
              {r.worker_photo || '👷'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold' }}>{r.worker_name}</div>
              <div style={{ fontSize: '12px', color: '#f59e0b' }}>⭐ {r.worker_rating} / 5</div>
              {r.price_offer && <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#22c55e', marginTop: '4px' }}>💰 {r.price_offer} ₽</div>}
              {r.comment && <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>📝 {r.comment}</div>}
            </div>
            <button onClick={() => acceptResponse(r.id)} style={{ padding: '8px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '40px', cursor: 'pointer' }}>
              Выбрать
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
