'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import OrderForm from '@/components/OrderForm';
import OrdersList from '@/components/OrdersList';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-4">Загрузка...</div>;
  if (!userId) return null;

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">PROJECT X - Клиент</h1>
        <button
          onClick={() => supabase.auth.signOut()}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Выйти
        </button>
      </div>
      
      <OrderForm userId={userId} onSuccess={() => window.location.reload()} />
      <div className="mt-8">
        <OrdersList userId={userId} refreshKey={0} />
      </div>
    </main>
  );
}
