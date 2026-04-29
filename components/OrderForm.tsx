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
    if (!address.text) {
      alert('❌ Укажите адрес на карте');
      return;
    }
    
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
      alert(`✅ Заказ #${result[0].id.slice(0, 8)} создан!\n\nСкоро с вами свяжутся грузчики`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="input-group">
        <label>📱 ТЕЛЕФОН</label>
        <input 
          {...register('phone', { required: true })} 
          placeholder="+7 (___)-___-__-__" 
        />
      </div>

      <div className="input-group">
        <label>💰 ТАРИФ</label>
        <div className="tariff-group">
          <div className="tariff-option">
            <input type="radio" value="hourly" id="hourly" {...register('tariff')} />
            <label htmlFor="hourly">⏱️ Почасовая</label>
          </div>
          <div className="tariff-option">
            <input type="radio" value="fixed" id="fixed" {...register('tariff')} />
            <label htmlFor="fixed">💰 Под ключ</label>
          </div>
        </div>
      </div>

      {tariff === 'hourly' ? (
        <div className="input-group">
          <label>⏱️ СТАВКА ЗА ЧАС</label>
          <input 
            {...register('hourly_rate', { required: true, min: 1 })} 
            type="number" 
            placeholder="500 ₽/час" 
          />
        </div>
      ) : (
        <div className="input-group">
          <label>💰 БЮДЖЕТ</label>
          <input 
            {...register('fixed_budget', { required: true, min: 1 })} 
            type="number" 
            placeholder="3000 ₽" 
          />
        </div>
      )}

      <div className="input-group">
        <label>📝 ОПИСАНИЕ</label>
        <textarea 
          {...register('description', { required: true })} 
          placeholder="Что нужно сделать?" 
          rows={3} 
        />
      </div>
      
      <div className="input-group">
        <label>📍 АДРЕС</label>
        <div className="map-wrapper">
          <ClientOnlyMap onAddressSelect={(text: string, lat: number, lng: number) => setAddress({ text, lat, lng })} />
        </div>
        {address.text && <div className="address-chip">{address.text}</div>}
      </div>

      <div className="input-group">
        <label>📅 ДАТА И ВРЕМЯ</label>
        <div className="double-row">
          <div>
            <input {...register('date', { required: true })} type="date" />
          </div>
          <div>
            <input {...register('time', { required: true })} type="time" />
          </div>
        </div>
      </div>

      <button type="submit" className="submit-btn" disabled={sending}>
        {sending ? '⏳ Отправка...' : '🚀 Опубликовать заказ'}
      </button>
    </form>
  );
}
