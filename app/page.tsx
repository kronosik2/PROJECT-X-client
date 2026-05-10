import Link from 'next/link';
import OrderForm from '@/components/OrderForm';

export default function Home() {
  return (
    <>
      <div className="hero">
        <div className="badge">🚚 Работаем с 2015 года</div>
        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-2">ПРОЕКТ X</h1>
        <p className="text-lg opacity-90">Грузчики за 10 минут · Без менеджеров</p>
        
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/" className="bg-white/20 backdrop-blur px-5 py-2 rounded-full hover:bg-white/30 transition">📝 Создать заказ</Link>
          <Link href="/orders" className="bg-white/10 backdrop-blur px-5 py-2 rounded-full hover:bg-white/20 transition">📋 Мои заказы</Link>
        </div>
      </div>
      
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="form-card">
          <OrderForm />
        </div>
      </div>
    </>
  );
}
