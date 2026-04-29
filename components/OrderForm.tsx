'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import ClientOnlyMap from './ClientOnlyMap';

export default function OrderForm() {
  const { register, handleSubmit, watch } = useForm();
  const tariff = watch('tariff', 'hourly');
  const [address, setAddress] = useState({ text: '', lat: 0, lng: 0 });
  const [sending, setSending] = useState(false);

  const onSubmit = async (data: any) => {
    setSending(true);
    
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
    
    setSending(false);
    
    if (error) {
      alert('❌ Ошибка: ' + error.message);
    } else {
      alert(`✅ Заказ создан! Номер: ${result[0].id}\nСкоро с вами свяжутся грузчики`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="field">
        <label className="field-label">📱 Ваш телефон</label>
        <input 
          {...register('phone', { required: true })} 
          placeholder="+7 (999) 123-45-67" 
        />
      </div>

      <div className="field">
        <label className="field-label">💰 Способ оплаты</label>
        <div className="radio-group">
          <label>
            <input type="radio" value="hourly" {...register('tariff')} /> 
            Почасовая (₽/час)
          </label>
          <label>
            <input type="radio" value="fixed" {...register('tariff')} /> 
            Фиксированный бюджет
          </label>
        </div>
      </div>

      {tariff === 'hourly' && (
        <div className="field">
          <label className="field-label">⏱️ Ставка за час</label>
          <input 
            {...register('hourly_rate', { required: true, min: 1 })} 
            type="number" 
            placeholder="Например: 500" 
          />
        </div>
      )}
      
      {tariff === 'fixed' && (
        <div className="field">
          <label className="field-label">💰 Бюджет на всю работу</label>
          <input 
            {...register('fixed_budget', { required: true, min: 1 })} 
            type="number" 
            placeholder="Например: 3000" 
          />
        </div>
      )}

      <div className="field">
        <label className="field-label">📝 Описание работ</label>
        <textarea 
          {...register('description', { required: true })} 
          placeholder="Например: поднять диван на 3 этаж, разгрузить фуру, собрать шкаф..."
          rows={3} 
        />
      </div>
      
      <div className="field">
        <label className="field-label">📍 Адрес (кликните на карту)</label>
        <div className="map-container">
          <ClientOnlyMap onAddressSelect={(text: string, lat: number, lng: number) => setAddress({ text, lat, lng })} />
        </div>
        {address.text && (
          <div className="address-badge">
            ✅ Выбрано: {address.text}
          </div>
        )}
      </div>

      <div className="field">
        <label className="field-label">📅 Когда нужны грузчики?</label>
        <div className="row-2cols">
          <input {...register('date', { required: true })} type="date" />
          <input {...register('time', { required: true })} type="time" />
        </div>
      </div>

      <button type="submit" disabled={sending}>
        {sending ? 'Отправка...' : '🚀 Опубликовать заказ'}
      </button>
    </form>
  );
}
