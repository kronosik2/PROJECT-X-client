'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Response {
  id: string;
  worker_id: string;
  worker_name: string;
  worker_phone: string;
  proposed_price: number;
  created_at: string;
}

interface Props {
  orderId: string;
  onWorkerSelected: () => void;
}

export default function ResponsesList({ orderId, onWorkerSelected }: Props) {
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponses();
  }, [orderId]);

  async function fetchResponses() {
    // В новой архитектуре "отклики" — это заказы с worker_id и статусом pending?
    // Нет — откликов как отдельной таблицы больше нет.
    // Грузчик сразу занимает заказ (take_order) → статус становится approved.
    // Поэтому отдельной ленты откликов у клиента больше нет.
    // Нужно переосмыслить: клиент видит, кто занял его заказ, через поле worker_id.
    // Если нужна история откликов (кто хотел взять, но не успел) — тогда без таблицы responses не обойтись.
    
    // Пока оставим заглушку — в новой архитектуре отклики не нужны,
    // клиент сразу видит исполнителя после того, как грузчик вызвал take_order()
    
    setLoading(false);
  }

  if (loading) return <div className="text-sm text-gray-500">Загрузка откликов...</div>;
  if (responses.length === 0) return null;
  
  return (
    <div className="mt-3 p-3 bg-gray-50 rounded">
      <h4 className="font-semibold text-sm mb-2">Отклики грузчиков:</h4>
      {responses.map(resp => (
        <div key={resp.id} className="flex justify-between items-center p-2 border-b">
          <div>
            <p className="font-medium">{resp.worker_name}</p>
            <p className="text-sm text-gray-600">{resp.worker_phone}</p>
            <p className="text-sm">💰 {resp.proposed_price} ₽</p>
          </div>
        </div>
      ))}
    </div>
  );
}
