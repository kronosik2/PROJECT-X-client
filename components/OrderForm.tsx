'use client';
import { useState } from 'react';

export default function OrderForm() {
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Заказ создан! Телефон: ${phone}, Описание: ${description}`);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        placeholder="Телефон" 
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={{ display: 'block', margin: '10px 0', padding: '8px' }}
      />
      <textarea 
        placeholder="Описание работ"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ display: 'block', margin: '10px 0', padding: '8px' }}
      />
      <button type="submit" style={{ padding: '10px 20px', background: 'blue', color: 'white' }}>
        Опубликовать заказ
      </button>
    </form>
  );
}
