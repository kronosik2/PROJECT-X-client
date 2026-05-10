'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ClientPage() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    tariff: 'fixed',
    fixed_budget: '',
    hourly_rate: '',
    time_slot: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('client_id');
    if (saved) {
      supabase.from('clients').select('*').eq('id', saved).single()
        .then(({ data }) => {
          setClient(data);
          if (data) fetchOrders(data.id);
        });
    }
    setLoading(false);
  }, []);

  async function fetchOrders(clientId: string) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  async function handleLogin() {
    const phone = prompt('Введите номер телефона:');
    if (!phone) return;

    let { data: existing } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', phone)
      .single();

    if (!existing) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({ phone, name: phone })
        .select()
        .single();
      existing = newClient;
    }

    if (existing) {
      setClient(existing);
      localStorage.setItem('client_id', existing.id);
      fetchOrders(existing.id);
    }
  }

  const getDisplayPrice = () => {
    if (form.tariff === 'fixed') {
      return parseFloat(form.fixed_budget) || 0;
    } else {
      const rate = parseFloat(form.hourly_rate);
      return rate ? rate * 4 : 0;
    }
  };

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    
    const price = getDisplayPrice();
    if (price < 200) {
      alert('Минимальная стоимость заказа — 200₽');
      return;
    }

    const insertData: any = {
      client_id: client.id,
      title: form.title,
      description: form.description,
      address: form.address,
      tariff: form.tariff,
      price: price,
      time_slot: form.time_slot || new Date().toISOString(),
      status: 'pending'
    };

    if (form.tariff === 'fixed') {
      insertData.fixed_budget = parseFloat(form.fixed_budget);
    } else {
      insertData.hourly_rate = parseFloat(form.hourly_rate);
    }

    const { error } = await supabase.from('orders').insert(insertData);

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      alert('✅ Заказ создан!');
      setForm({
        title: '',
        description: '',
        address: '',
        tariff: 'fixed',
        fixed_budget: '',
        hourly_rate: '',
        time_slot: ''
      });
      fetchOrders(client.id);
    }
  }

  if (loading) return <div className="p-4">Загрузка...</div>;

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">ПРОЕКТ X</h1>
          <button onClick={handleLogin} className="bg-blue-600 text-white px-6 py-2 rounded">
            Войти по телефону
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ПРОЕКТ X — Клиент</h1>
        <button
          onClick={() => {
            setClient(null);
            localStorage.removeItem('client_id');
          }}
          className="text-red-600 text-sm"
        >
          Выйти
        </button>
      </div>

      <form onSubmit={createOrder} className="bg-gray-100 p-4 rounded-lg space-y-3">
        <h2 className="font-bold text-lg">📦 Новый заказ</h2>
        
        <input
          type="text"
          placeholder="Название"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        
        <textarea
          placeholder="Описание работ"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full p-2 border rounded"
          rows={3}
          required
        />
        
        <input
          type="text"
          placeholder="Адрес"
          value={form.address}
          onChange={e => setForm({ ...form, address: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
        
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="radio" value="fixed" checked={form.tariff === 'fixed'} onChange={() => setForm({ ...form, tariff: 'fixed' })} />
            Фикс-цена
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="hourly" checked={form.tariff === 'hourly'} onChange={() => setForm({ ...form, tariff: 'hourly' })} />
            Почасовая
          </label>
        </div>
        
        {form.tariff === 'fixed' ? (
          <input
            type="number"
            placeholder="Бюджет (₽)"
            value={form.fixed_budget}
            onChange={e => setForm({ ...form, fixed_budget: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        ) : (
          <input
            type="number"
            placeholder="Ставка за час (₽)"
            value={form.hourly_rate}
            onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        )}
        
        <input
          type="datetime-local"
          value={form.time_slot}
          onChange={e => setForm({ ...form, time_slot: e.target.value })}
          className="w-full p-2 border rounded"
        />
        
        {getDisplayPrice() > 0 && (
          <div className="text-sm bg-blue-50 p-2 rounded">
            💰 Стоимость: <strong>{getDisplayPrice()} ₽</strong>
          </div>
        )}
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Создать заказ
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">📋 Мои заказы</h2>
        {orders.length === 0 && <p className="text-gray-500">У вас пока нет заказов</p>}
        {orders.map(order => (
          <div key={order.id} className="border rounded-lg p-4 mb-3">
            <h3 className="font-bold">{order.title}</h3>
            <p className="text-gray-600">{order.description}</p>
            <p className="text-sm">📍 {order.address}</p>
            <p className="font-bold mt-2">{order.price} ₽</p>
            <p className="text-sm">Статус: {order.status}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
