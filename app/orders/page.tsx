'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientId = localStorage.getItem('client_id');
    if (clientId) {
      supabase
        .from('orders')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setOrders(data || []);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gradient-custom">
      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="mb-6">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← На главную
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-gradient mb-8">📋 Мои заказы</h1>
        
        {orders.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-white/60">У вас пока нет заказов</p>
            <Link href="/" className="btn-gradient inline-block mt-4 px-6 py-2 rounded-full">
              Создать заказ
            </Link>
          </div>
        )}
        
        <div className="space-y-4">
          {orders.map(order => {
            const getStatusClass = () => {
              switch (order.status) {
                case 'pending': return 'status-pending';
                case 'approved': return 'status-approved';
                case 'confirmed': return 'status-confirmed';
                case 'completed': return 'status-completed';
                case 'cancelled': return 'status-cancelled';
                default: return 'status-pending';
              }
            };
            
            const getStatusText = () => {
              switch (order.status) {
                case 'pending': return 'Ожидает';
                case 'approved': return 'Подтверждён';
                case 'confirmed': return 'В работе';
                case 'completed': return 'Выполнен';
                case 'cancelled': return 'Отменён';
                default: return 'Ожидает';
              }
            };
            
            return (
              <div key={order.id} className="glass-card p-5 hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <h2 className="text-xl font-bold">{order.title}</h2>
                  <span className={getStatusClass()}>{getStatusText()}</span>
                </div>
                <p className="text-white/70 text-sm mb-2">{order.description}</p>
                <p className="text-sm text-white/50 mb-2">📍 {order.address}, {order.city}</p>
                <p className="text-2xl font-bold text-gradient mt-2">{order.price} ₽</p>
                <p className="text-xs text-white/40 mt-2">
                  {new Date(order.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
