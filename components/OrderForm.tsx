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
        className="input-glass w-full"
        required
      />
      
      <textarea
        placeholder="Описание работ"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        className="input-glass w-full"
        rows={3}
        required
      />
      
      <input
        type="text"
        placeholder="Город"
        value={form.city}
        onChange={e => setForm({ ...form, city: e.target.value })}
        className="input-glass w-full"
        required
      />
      
      <input
        type="text"
        placeholder="Адрес (выберите на карте)"
        value={form.address}
        readOnly
        className="input-glass w-full bg-white/5 cursor-pointer"
        required
      />
      
      <div className="rounded-xl overflow-hidden border border-white/10">
        <YandexMap onAddressSelect={handleAddressSelect} />
      </div>
      
      <div className="flex gap-4 flex-wrap">
        <label className="radio-glass flex items-center gap-2 cursor-pointer">
          <input type="radio" value="fixed" checked={form.tariff === 'fixed'} onChange={() => setForm({ ...form, tariff: 'fixed' })} className="w-4 h-4" />
          <span>Фикс-цена</span>
        </label>
        <label className="radio-glass flex items-center gap-2 cursor-pointer">
          <input type="radio" value="hourly" checked={form.tariff === 'hourly'} onChange={() => setForm({ ...form, tariff: 'hourly' })} className="w-4 h-4" />
          <span>Почасовая</span>
        </label>
      </div>
      
      {form.tariff === 'fixed' ? (
        <input
          type="number"
          placeholder="Бюджет (₽)"
          value={form.fixed_budget}
          onChange={e => setForm({ ...form, fixed_budget: e.target.value })}
          className="input-glass w-full"
          required
        />
      ) : (
        <input
          type="number"
          placeholder="Ставка за час (₽)"
          value={form.hourly_rate}
          onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
          className="input-glass w-full"
          required
        />
      )}
      
      <div className="flex gap-2">
        <input
          type="datetime-local"
          value={form.time_slot}
          onChange={e => setForm({ ...form, time_slot: e.target.value })}
          className="input-glass flex-1"
        />
        <button
          type="button"
          onClick={setNearestTime}
          className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all"
        >
          🕐 Ближайшее
        </button>
      </div>
      
      {getDisplayPrice() > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-white/10 p-4 rounded-xl text-center">
          <p className="text-sm text-white/60">💰 Стоимость</p>
          <p className="text-3xl font-bold text-gradient">{getDisplayPrice()} ₽</p>
          <p className="text-xs text-white/50 mt-1">резерв исполнителя: {Math.max(getDisplayPrice() * 0.1, 200)} ₽</p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="btn-gradient w-full py-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {loading ? 'Создание...' : 'Создать заказ'}
      </button>
    </form>
  );
}
