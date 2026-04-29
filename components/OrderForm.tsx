'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import ClientOnlyMap from './ClientOnlyMap';

export default function OrderForm() {
  const { register, handleSubmit, watch } = useForm();
  const tariff = watch('tariff', 'hourly');
  const [address, setAddress] = useState({ text: '', lat: 0, lng: 0 });

  const onSubmit = async (data: any) => {
    const order = {
      client_phone: data.phone,
      tariff: data.tariff,
      hourly_rate: data.tariff === 'hourly' ? parseInt(data.hourly_rate) : null,
      fixed_budget: data.tariff === 'fixed' ? parseInt(data.fixed_budget) : null,
      work_description: data.description,
      address: address.text,
      lat: address.lat,
      lng: address.lng,
      time_slot: new Date(data.date + 'T' + data.time).toISOString(),
      status: 'open'
    };
    
    const { data: result, error } = await supabase.from('orders').insert([order]).select();
    if (error) {
      alert('Ошибка: ' + error.message);
    } else {
      alert(`Заказ создан! Номер: ${result[0].id}`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">Создать заказ</h2>
      
      {/* Телефон */}
      <input 
        {...register('phone', { required: true })} 
        placeholder="Ваш телефон" 
        className="border p-2 w-full rounded" 
      />
      
      {/* Выбор тарифа */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          <input type="radio" value="hourly" {...register('tariff')} /> 
          Почасовая оплата
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" value="fixed" {...register('tariff')} /> 
          Фиксированный бюджет
        </label>
      </div>

      {/* Поле для цены (зависит от тарифа) */}
      {tariff === 'hourly' && (
        <input 
          {...register('hourly_rate', { required: true, min: 1 })} 
          type="number" 
          placeholder="Ставка в час (₽)" 
          className="border p-2 w-full rounded" 
        />
      )}
      
      {tariff === 'fixed' && (
        <input 
          {...register('fixed_budget', { required: true, min: 1 })} 
          type="number" 
          placeholder="Бюджет на всю работу (₽)" 
          className="border p-2 w-full rounded" 
        />
      )}

      {/* Описание работ */}
      <textarea 
        {...register('description', { required: true })} 
        placeholder="Опишите, что нужно сделать" 
        className="border p-2 w-full rounded" 
        rows={3} 
      />
      
      {/* Карта */}
      <div>
        <p className="mb-2 font-medium">Укажите адрес на карте:</p>
        <YandexMap onAddressSelect={(text: string, lat: number, lng: number) => setAddress({ text, lat, lng })} />
        {address.text && (
          <p className="mt-2 text-sm text-green-700">
            ✅ Адрес: {address.text}
          </p>
        )}
      </div>

      {/* Дата и время */}
      <div className="flex gap-4">
        <input 
          {...register('date', { required: true })} 
          type="date" 
          className="border p-2 w-1/2 rounded" 
        />
        <input 
          {...register('time', { required: true })} 
          type="time" 
          className="border p-2 w-1/2 rounded" 
        />
      </div>

      <button 
        type="submit" 
        className="bg-blue-600 text-white p-3 rounded-xl w-full hover:bg-blue-700 transition"
      >
        Опубликовать заказ
      </button>
    </form>
  );
}
