'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import YandexMap from './YandexMap';

export default function OrderForm() {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Курган');
  const [description, setDescription] = useState('');
  const [tariff, setTariff] = useState('fixed');
  const [fixedBudget, setFixedBudget] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [lat, setLat] = useState(55.441);
  const [lng, setLng] = useState(65.341);

  const getDisplayPrice = () => {
    if (tariff === 'fixed') {
      return parseFloat(fixedBudget) || 0;
    } else {
      const rate = parseFloat(hourlyRate);
      return rate ? rate * 4 : 0;
    }
  };

  const setNearestTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    now.setMinutes(0);
    setTimeSlot(now.toISOString().slice(0, 16));
  };

  const handleAddressSelect = (addr: string, latitude: number, longitude: number) => {
    setAddress(addr);
    if (latitude && longitude) {
      setLat(latitude);
      setLng(longitude);
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

    if (!address) {
      alert('Выберите адрес на карте или введите его');
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
      title: `Заказ от ${new Date().toLocaleDateString()}`,
      description: description,
      address: address,
      city: city,
      lat: lat,
      lng: lng,
      tariff: tariff,
      price: price,
      time_slot: timeSlot || new Date().toISOString(),
      status: 'pending'
    };

    if (tariff === 'fixed') {
      insertData.fixed_budget = parseFloat(fixedBudget);
    } else {
      insertData.hourly_rate = parseFloat(hourlyRate);
    }

    const { error } = await supabase.from('orders').insert(insertData);

    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      alert('✅ Заказ создан!');
      setAddress('');
      setDescription('');
      setFixedBudget('');
      setHourlyRate('');
      setTimeSlot('');
      window.location.href = '/orders';
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        placeholder="Описание работ"
        value={description}
        onChange={e => setDescription(e.target.value)}
        className="input-style w-full"
        rows={3}
        required
      />
      
      <input
        type="text"
        placeholder="Город"
        value={city}
        onChange={e => setCity(e.target.value)}
        className="input-style w-full"
        required
      />
      
      <YandexMap address={address} onAddressSelect={handleAddressSelect} />
      
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input type="radio" value="fixed" checked={tariff === 'fixed'} onChange={() => setTariff('fixed')} />
          Фикс-цена
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="hourly" checked={tariff === 'hourly'} onChange={() => setTariff('hourly')} />
          Почасовая
        </label>
      </div>
      
      {tariff === 'fixed' ? (
        <input
          type="number"
          placeholder="Бюджет (₽)"
          value={fixedBudget}
          onChange={e => setFixedBudget(e.target.value)}
          className="input-style w-full"
          required
        />
      ) : (
        <input
          type="number"
          placeholder="Ставка за час (₽)"
          value={hourlyRate}
          onChange={e => setHourlyRate(e.target.value)}
          className="input-style w-full"
          required
        />
      )}
      
      <div className="flex gap-2">
        <input
          type="datetime-local"
          value={timeSlot}
          onChange={e => setTimeSlot(e.target.value)}
          className="input-style flex-1"
        />
        <button
          type="button"
          onClick={setNearestTime}
          className="px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
        >
          🕐 Ближайшее
        </button>
      </div>
      
      {getDisplayPrice() > 0 && (
        <div className="bg-blue-50 p-4 rounded-xl text-center">
          <p className="text-sm text-gray-600">💰 Стоимость</p>
          <p className="text-2xl font-bold text-blue-600">{getDisplayPrice()} ₽</p>
          <p className="text-xs text-gray-500 mt-1">резерв исполнителя: {Math.max(getDisplayPrice() * 0.1, 200)} ₽</p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? 'Создание...' : 'Создать заказ'}
      </button>
    </form>
  );
}
