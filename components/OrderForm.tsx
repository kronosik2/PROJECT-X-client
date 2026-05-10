'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  clientId: string;
  onSuccess: () => void;
}

export default function OrderForm({ clientId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    tariff: 'fixed',
    fixed_budget: '',
    hourly_rate: '',
    time_slot: ''
  });

  const getDisplayPrice = () => {
    if (form.tariff === 'fixed') {
      return parseFloat(form.fixed_budget) || 0;
    } else {
      const rate = parseFloat(form.hourly_rate);
      return rate ? rate * 4 : 0;
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const price = getDisplayPrice();
    if (price < 200) {
      alert('Минимальная стоимость заказа — 200₽');
      setLoading(false);
      return;
    }

    const insertData: any = {
      client_id: clientId,
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
      alert(`✅ Заказ создан! Резерв для исполнителя: ${Math.max(price * 0.1, 200)} ₽`);
      setForm({
        title: '',
        description: '',
        address: '',
        tariff: 'fixed',
        fixed_budget: '',
        hourly_rate: '',
        time_slot: ''
      });
      onSuccess();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded-lg space-y-3">
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
          <br />
          🔒 Резерв исполнителя: <strong>{Math.max(getDisplayPrice() * 0.1, 200)} ₽</strong> (10%)
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Создание...' : 'Создать заказ'}
      </button>
    </form>
  );
}
