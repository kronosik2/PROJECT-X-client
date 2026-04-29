import OrderForm from '@/components/OrderForm';

export default function Home() {
  return (
    <>
      <div className="hero">
        <div className="badge">🚚 Работаем с 2015 года</div>
        <h1>ПРОЕКТ X</h1>
        <h2>Грузчики за 10 минут · Без менеджеров · Честные цены</h2>
      </div>
      
      <div className="form-wrapper">
        <div className="form-card">
          <OrderForm />
        </div>
      </div>
    </>
  );
}
