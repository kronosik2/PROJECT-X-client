'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabaseClient';
import OrderForm from '@/components/OrderForm';
import OrdersList from '@/components/OrdersList';

export default function HomePage() {
  const { user, isSignedIn } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!isSignedIn) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold">Добро пожаловать в PROJECT X</h1>
        <p className="mt-2">Войдите, чтобы создать заказ</p>
      </div>
    );
  }

  const refreshOrders = () => setRefreshKey(prev => prev + 1);

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Создать заказ</h1>
      
      <OrderForm userId={user.id} onSuccess={refreshOrders} />
      
      <div className="mt-8">
        <OrdersList userId={user.id} refreshKey={refreshKey} />
      </div>
    </main>
  );
}
