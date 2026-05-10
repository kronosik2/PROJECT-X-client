'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ClientPage() {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('client_id');
    if (saved) {
      supabase.from('clients').select('*').eq('id', saved).single()
        .then(({ data }) => setClient(data));
    }
    setLoading(false);
  }, []);

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
    }
  }

  if (loading) return <div className="p-4">Загрузка...</div>;
  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold mb-4">ПРОЕКТ X</h1>
          <button onClick={handleLogin} className="bg-blue-600 text-white px-6 py-2 rounded">
            Войти по телефону
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold">ПРОЕКТ X — Клиент</h1>
      <p className="text-gray-600 mt-2">Добро пожаловать, {client.name}</p>
    </main>
  );
}
