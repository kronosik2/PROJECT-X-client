import Link from 'next/link';
import OrderForm from '@/components/OrderForm';

export default function Home() {
  return (
    <>
      <div className="hero">
        <div className="badge">🚚 Работаем с 2015 года</div>
        <h1>ПРОЕКТ X</h1>
        <p>Грузчики за 10 минут · Без менеджеров</p>
        
        {/* Меню навигации */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px' }}>
          <Link href="/" style={{ color: 'white', textDecoration: 'none', padding: '8px 20px', borderRadius: '40px', background: 'rgba(255,255,255,0.15)' }}>📝 Создать заказ</Link>
          <Link href="/orders" style={{ color: 'white', textDecoration: 'none', padding: '8px 20px', borderRadius: '40px', background: 'rgba(255,255,255,0.1)' }}>📋 Мои заказы</Link>
        </div>
      </div>
      
      <div className="form-wrapper">
        <div className="form-card">
          <OrderForm />
        </div>
      </div>
    </>
  );
}
