'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  userId: string;
  onSuccess: () => void;
}

export default function OrderForm({ userId, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    price: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('orders').insert({
      client_id: userId,
      title: form.title,
      description: form.description,
      address: form.address,
      price: parseFloat(form.price),
      status: 'pending'
    });

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      setForm({ title: '', description: '', address: '', price: '' });
      onSuccess();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded-lg space-y-3">
      <input
        type="text"
        placeholder="Название заказа"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        className="w-full p-2 border rounded"
        required
      />
      <textarea
        placeholder="Описание"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        className="w-full p-2 border rounded"
        rows={3}
      />
      <input
        type="text"
        placeholder="Адрес"
        value={form.address}
        onChange={e => setForm({ ...form, address: e.target.value })}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="number"
        placeholder="Цена (₽)"
        value={form.price}
        onChange={e => setForm({ ...form, price: e.target.value })}
        className="w-full p-2 border rounded"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Создание...' : 'Создать заказ'}
      </button>
    </form>
  );
}
