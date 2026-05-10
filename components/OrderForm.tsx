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
    tariff: 'fixed',        // 'fixed' или 'hourly'
    fixed_budget: '',       // для фикс-цены
    hourly_rate: ''         // для почасовки
  });

  // Рассчитываем итоговую цену для показа (не сохраняется в БД отдельно)
  const getDisplayPrice = () => {
    if (form.tariff === 'fixed') {
      return parseFloat(form.fixed_budget) || 0;
    } else {
      const rate = parseFloat(form.hourly_rate);
      return rate ? rate * 4 : 0; // минималка 4 часа
    }
  };

  // Рассчитываем резерв для исполнителя (10%)
  const getReserveAmount = () => {
    const price = getDisplayPrice();
    return Math.max(price * 0.1, 10);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!userId) {
      alert('Пользователь не авторизован');
      setLoading(false);
      return;
    }

    // Подготовка данных для вставки
    const insertData: any = {
      client_id: userId,
      title: form.title,
      description: form.description,
      address: form.address,
      tariff: form.tariff,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    if (form.tariff === 'fixed') {
      insertData.fixed_budget = parseFloat(form.fixed_budget);
      insertData.price = parseFloat(form.fixed_budget); // общая цена
      insertData.hourly_rate = null;
    } else {
      insertData.hourly_rate = parseFloat(form.hourly_rate);
      insertData.price = parseFloat(form.hourly_rate) * 4; // минималка 4 часа
      insertData.fixed_budget = null;
    }

    const { error } = await supabase.from('orders').insert(insertData);

    if (error) {
      alert('Ошибка: ' + error.message);
      console.error(error);
    } else {
      alert(`Заказ создан! Резерв для исполнителя: ${getReserveAmount()} ₽ (10% от суммы)`);
      setForm({
        title: '',
        description: '',
        address: '',
        tariff: 'fixed',
        fixed_budget: '',
        hourly_rate: ''
      });
      onSuccess(); // обновляем список заказов
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded-lg space-y-3">
      <h2 className="font-bold text-lg mb-2">Создать новый заказ</h2>
      
      <input
        type="text"
        placeholder="Название заказа"
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
      
      {/* Выбор тарифа */}
      <div className="flex gap-4 p-2 bg-white rounded border">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="fixed"
            checked={form.tariff === 'fixed'}
            onChange={() => setForm({ ...form, tariff: 'fixed' })}
          />
          <span>Фиксированная цена</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            value="hourly"
            checked={form.tariff === 'hourly'}
            onChange={() => setForm({ ...form, tariff: 'hourly' })}
          />
          <span>Почасовая оплата</span>
        </label>
      </div>
      
      {/* Поля в зависимости от тарифа */}
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
      
      {/* Информация о предварительной стоимости */}
      {getDisplayPrice() > 0 && (
        <div className="text-sm bg-blue-50 p-2 rounded">
          <p>💰 Предварительная стоимость: <strong>{getDisplayPrice()} ₽</strong></p>
          <p className="text-xs text-gray-600 mt-1">
            🔒 Резерв для исполнителя (10%): <strong>{getReserveAmount()} ₽</strong>
            {form.tariff === 'hourly' && ' (из расчёта 4 часа минимум)'}
          </p>
        </div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? 'Создание...' : 'Создать заказ'}
      </button>
    </form>
  );
}
