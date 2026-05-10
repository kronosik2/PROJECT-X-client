'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

declare global {
  interface Window {
    ymaps: any;
  }
}

export default function ClientPage() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const mapRef = useRef<any>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    tariff: 'fixed',
    fixed_budget: '',
    hourly_rate: '',
    time_slot: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('client_id');
    if (saved) {
      supabase.from('clients').select('*').eq('id', saved).single()
        .then(({ data }) => {
          setClient(data);
          if (data) fetchOrders(data.id);
        });
    }
    setLoading(false);

    // Загружаем Яндекс карты
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=634a4b7a-9223-4242-a550-70a59758ef72&lang=ru_RU';
    script.async = true;
    script.onload = () => {
      window.ymaps.ready(() => {
        if (mapRef.current) {
          const map = new window.ymaps.Map(mapRef.current, {
            center: [55.751574, 37.573856],
            zoom: 10,
            controls: ['zoomControl', 'fullscreenControl']
          });
          mapRef.current.map = map;
        }
      });
    };
    document.body.appendChild(script);
  }, []);

  async function fetchOrders(clientId: string) {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  async function handleLogin() {
    const phone = prompt('Введите номер телефона:');
    if (!phone) return;

    let { data: existing } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', phone)
      .single();

    if (!existing) {
      const { data: newClient } = await supabase
        .from('clients')
        .insert({ phone, name: phone })
        .select()
        .single();
      existing = newClient;
    }

    if (existing) {
      setClient(existing);
      localStorage.setItem('client_id', existing.id);
      fetchOrders(existing.id);
    }
  }

  const getDisplayPrice = () => {
    if (form.tariff === 'fixed') {
      return parseFloat(form.fixed_budget) || 0;
    } else {
      const rate = parseFloat(form.hourly_rate);
      return rate ? rate * 4 : 0;
    }
  };

  const handleAddressInput = async (value: string) => {
    setForm({ ...form, address: value });
    if (value.length > 2) {
      const response = await fetch(
        `https://geocode-maps.yandex.ru/1.x/?apikey=ваш_ключ_яндекс&geocode=${encodeURIComponent(value)}&format=json`
      );
      const data = await response.json();
      const addresses = data.response.GeoObjectCollection.featureMember.map((item: any) => ({
        text: item.GeoObject.metaDataProperty.GeocoderMetaData.text,
        coordinates: item.GeoObject.Point.pos.split(' ').reverse()
      }));
      setSuggestions(addresses);
    } else {
      setSuggestions([]);
    }
  };

  const selectAddress = (address: any) => {
    setForm({ ...form, address: address.text });
    setSuggestions([]);
    if (mapRef.current?.map) {
      mapRef.current.map.setCenter(address.coordinates, 15);
      new window.ymaps.Placemark(address.coordinates, {}, { preset: 'islands#redIcon' })
        .addTo(mapRef.current.map);
    }
  };

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    
    const price = getDisplayPrice();
    if (price < 200) {
      alert('Минимальная стоимость заказа — 200₽');
      return;
    }

    const insertData: any = {
      client_id: client.id,
      title: form.title,
      description: form.description,
      address: form.address,
      city: form.city,
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
        city: '',
        tariff: 'fixed',
        fixed_budget: '',
        hourly_rate: '',
        time_slot: ''
      });
      fetchOrders(client.id);
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen">Загрузка...</div>;

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">🤝 ПРОЕКТ X</h1>
          <p className="text-gray-600 mb-6">Помогаем найти надёжных исполнителей</p>
          <button 
            onClick={handleLogin} 
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            📱 Войти по телефону
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">🤝 ПРОЕКТ X</h1>
            <p className="text-gray-500 mt-1">Добро пожаловать, {client.name}</p>
          </div>
          <button
            onClick={() => {
              setClient(null);
              localStorage.removeItem('client_id');
            }}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Выйти
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Форма создания заказа */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">📦 Создать заказ</h2>
          
          <form onSubmit={createOrder} className="space-y-4">
            <input
              type="text"
              placeholder="Название заказа"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            
            <textarea
              placeholder="Описание работ"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
            
            <input
              type="text"
              placeholder="Город"
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            
            <div className="relative">
              <input
                type="text"
                placeholder="Адрес"
                value={form.address}
                onChange={e => handleAddressInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-auto">
                  {suggestions.map((sugg, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectAddress(sugg)}
                      className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      {sugg.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div ref={el => mapRef.current = el} className="h-64 rounded-xl overflow-hidden border border-gray-200"></div>
            
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
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            ) : (
              <input
                type="number"
                placeholder="Ставка за час (₽)"
                value={form.hourly_rate}
                onChange={e => setForm({ ...form, hourly_rate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            )}
            
            <input
              type="datetime-local"
              value={form.time_slot}
              onChange={e => setForm({ ...form, time_slot: e.target.value })}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            {getDisplayPrice() > 0 && (
              <div className="bg-blue-50 p-3 rounded-xl text-center">
                <p className="text-sm text-gray-600">💰 Стоимость</p>
                <p className="text-2xl font-bold text-blue-600">{getDisplayPrice()} ₽</p>
                <p className="text-xs text-gray-500 mt-1">резерв исполнителя: {Math.max(getDisplayPrice() * 0.1, 200)} ₽</p>
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Создать заказ
            </button>
          </form>
        </div>

        {/* Список заказов */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">📋 Мои заказы</h2>
          <div className="space-y-3 max-h-[600px] overflow-auto">
            {orders.length === 0 && (
              <p className="text-gray-500 text-center py-8">У вас пока нет заказов</p>
            )}
            {orders.map(order => {
              const statusColors: Record<string, string> = {
                pending: 'bg-yellow-100 text-yellow-800',
                approved: 'bg-blue-100 text-blue-800',
                confirmed: 'bg-purple-100 text-purple-800',
                completed: 'bg-green-100 text-green-800',
                cancelled: 'bg-red-100 text-red-800'
              };
              const statusText: Record<string, string> = {
                pending: 'Ожидает',
                approved: 'Подтверждён',
                confirmed: 'В работе',
                completed: 'Выполнен',
                cancelled: 'Отменён'
              };
              return (
                <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800">{order.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                      {statusText[order.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{order.description}</p>
                  <p className="text-xs text-gray-500 mb-2">📍 {order.address}</p>
                  <p className="text-lg font-bold text-blue-600">{order.price} ₽</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
