'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import YandexMap from './YandexMap';

interface OrderFormProps {
  clientId: string;
  onSuccess: () => void;
}

export default function OrderForm({ clientId, onSuccess }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Курган');
  const [description, setDescription] = useState('');
  const [tariff, setTariff] = useState('fixed');
  const [fixedBudget, setFixedBudget] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [shiftPrice, setShiftPrice] = useState('');
  const [workersCount, setWorkersCount] = useState(1);
  const [timeSlot, setTimeSlot] = useState('');
  const [lat, setLat] = useState(55.441);
  const [lng, setLng] = useState(65.341);

  const getRecommendedPrice = () => {
    if (tariff === 'fixed') return 2000;
    if (tariff === 'hourly') return 400;
    if (tariff === 'shift') return 2500;
    return 0;
  };

  const getDisplayPrice = () => {
    let basePrice = 0;
    if (tariff === 'fixed') {
      basePrice = parseFloat(fixedBudget) || 0;
    } else if (tariff === 'hourly') {
      basePrice = (parseFloat(hourlyRate) || 0) * 4;
    } else if (tariff === 'shift') {
      basePrice = parseFloat(shiftPrice) || 0;
    }
    return basePrice * workersCount;
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

    const insertData: any = {
      client_id: clientId,
      title: `Заказ от ${new Date().toLocaleDateString()}`,
      description: description,
      address: address,
      city: city,
      lat: lat,
      lng: lng,
      tariff: tariff,
      price: price,
      workers_count: workersCount,
      time_slot: timeSlot || new Date().toISOString(),
      status: 'pending'
    };

    if (tariff === 'fixed') {
      insertData.fixed_budget = parseFloat(fixedBudget);
    } else if (tariff === 'hourly') {
      insertData.hourly_rate = parseFloat(hourlyRate);
    } else if (tariff === 'shift') {
      insertData.fixed_budget = parseFloat(shiftPrice);
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
      setShiftPrice('');
      setWorkersCount(1);
      setTimeSlot('');
      onSuccess(); // вызываем обновление списка заказов
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
      
      <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
          <input type="radio" value="fixed" checked={tariff === 'fixed'} onChange={() => setTariff('fixed')} />
          Фикс-цена
        </label>
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
          <input type="radio" value="hourly" checked={tariff === 'hourly'} onChange={() => setTariff('hourly')} />
          Почасовая
        </label>
        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
          <input type="radio" value="shift" checked={tariff === 'shift'} onChange={() => setTariff('shift')} />
          Смена
        </label>
      </div>
      
      {tariff === 'fixed' ? (
        <div>
          <input
            type="number"
            placeholder="Бюджет (₽)"
            value={fixedBudget}
            onChange={e => setFixedBudget(e.target.value)}
            className="input-style w-full"
            required
          />
          <p className="text-sm text-gray-500 mt-1">💰 Рекомендуемая цена: 2000 ₽</p>
        </div>
      ) : tariff === 'hourly' ? (
        <div>
          <input
            type="number"
            placeholder="Ставка за час (₽) за человека"
            value={hourlyRate}
            onChange={e => setHourlyRate(e.target.value)}
            className="input-style w-full"
            required
          />
          <p className="text-sm text-gray-500 mt-1">💰 Рекомендуемая цена: 400 ₽/час за человека</p>
        </div>
      ) : (
        <div>
          <input
            type="number"
            placeholder="Цена за смену (₽)"
            value={shiftPrice}
            onChange={e => setShiftPrice(e.target.value)}
            className="input-style w-full"
            required
          />
          <p className="text-sm text-gray-500 mt-1">💰 Рекомендуемая цена: 2500 ₽</p>
        </div>
      )}
      
      {(tariff === 'hourly' || tariff === 'shift') && (
        <div>
          <input
            type="number"
            placeholder="Количество человек"
            value={workersCount}
            onChange={e => setWorkersCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="input-style w-full"
            min="1"
            required
          />
          <p className="text-sm text-gray-500 mt-1">👥 {workersCount} человек × {tariff === 'hourly' ? `${hourlyRate || 0} ₽/час` : `${shiftPrice || 0} ₽`}</p>
        </div>
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
          <p className="text-sm text-gray-600">💰 Итого к оплате</p>
          <p className="text-2xl font-bold text-blue-600">{getDisplayPrice()} ₽</p>
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
