import Link from 'next/link';
import OrderForm from '@/components/OrderForm';

export default function Home() {
  return (
    <div className="bg-gradient-custom min-h-screen">
      <div className="hero relative overflow-hidden">
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center py-20 px-4">
          <div className="badge-gradient inline-block mb-4">
            🚚 Работаем с 2015 года
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            ПРОЕКТ X
          </h1>
          <p className="text-xl text-white/80 mb-8">
            Грузчики за 10 минут · Без менеджеров · Работаем с утра до вечера
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              href="/" 
              className="btn-gradient px-6 py-2 rounded-full text-white font-semibold"
            >
              📝 Создать заказ
            </Link>
            <Link 
              href="/orders" 
              className="bg-white/10 backdrop-blur-sm border border-white/20 px-6 py-2 rounded-full text-white font-semibold hover:bg-white/20 transition-all"
            >
              📋 Мои заказы
            </Link>
          </div>
        </div>
      </div>
      
      <div className="form-wrapper max-w-2xl mx-auto px-4 pb-20">
        <div className="glass-card p-6 md:p-8">
          <h2 className="text-2xl font-bold mb-6 text-gradient">Создание заказа</h2>
          <OrderForm />
        </div>
      </div>
    </div>
  );
}
