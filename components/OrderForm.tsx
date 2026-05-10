'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import YandexMap from './YandexMap';

export default function OrderForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    city: 'Курган',
    tariff: 'fixed',
    fixed_budget: '',
    hourly_rate: '',
    time_slot: '',
    lat: 55.441,
    lng: 65.341
  });

  const getDisplayPrice = () => {
    if (form.tariff === 'fixed') {
      return parseFloat(form.fixed_budget) || 0;
    } else {
      const rate = parseFloat(form.hourly_rate);
      return rate ? rate * 4 : 0;
    }
  };

  const setNearestTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    const formatted = now.toISOString().slice(0, 16);
    setForm({ ...form, time_slot: formatted });
  };

  const handleAddressSelect = (address: string, lat: number, lng: number) => {
    setForm({ ...form, address, lat, lng });
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

    const saved = localStorage.getItem('client_id');
    if (!saved) {
      alert('Клиент не найден');
      setLoading(false);
      return;
    }

    const insertData: any = {
      client_id: saved,
      title: form.title,
      description: form.description,
      address: form.address,
      city: form.city,
      lat: form.lat,
      lng: form.lng,
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
        city: 'Курган',
        tariff: 'fixed',
        fixed_budget: '',
        hourly_rate: '',
        time_slot: '',
        lat: 55.441,
        lng: 65.341
      });
      window.location.href = '/orders';
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Название заказа *"
        value={form.title}
        onChange={e => setForm({ ...form, title: e.target.value })}
        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
        required
      />
      
      <textarea
        placeholder="Описание работ"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
        rows={3}
        required
      />
      
      <input
        type="text"
        placeholder="Город"
        value={form.city}
        onChange={e => setForm({ ...form, city: e.target.value })}
        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
        required
      />
      
      <input
        type="text"
        placeholder="Адрес"
        value={form.address}
        readOnly
        className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50"
        required
      />
      
      <YandexMap onAddressSelect={handleAddressSelect} />
      
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
          className="w-full px-4 py-2 border border-gray-200 rounded-xl"
          required
        />
      ) : (
        <input
          type="number"
          placeholder="Ставка за час (₽)"
          value={form.hourly_rate}
          onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl"
          required
        />
      )}
      
      <div className="flex gap-2">
        <input
          type="datetime-local"
          value={form.time_slot}
          onChange={e => setForm({ ...form, time_slot: e.target.value })}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl"
        />
        <button
          type="button"
          onClick={setNearestTime}
          className="px-4 py-2 bg-gray-200 rounded-xl hover:bg-gray-300"
        >
          🕐 Ближайшее
        </button>
      </div>
      
      {getDisplayPrice() > 0 && (
        <div className="bg-blue-50 p-3 rounded-xl text-center">
          <p className="text-sm text-gray-600">💰 Стоимость</p>
          <p className="text-2xl font-bold text-blue-600">{getDisplayPrice()} ₽</p>
          <p className="text-xs text-gray-500">резерв: {Math.max(getDisplayPrice() * 0.1, 200)} ₽</p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg"
      >
        {loading ? 'Создание...' : 'Создать заказ'}
      </button>
    </form>
  );
}
