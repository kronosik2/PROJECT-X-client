import OrderForm from '@/components/OrderForm';

export default function Home() {
  return (
    <div>
      <h1>🚛 ПРОЕКТ X</h1>
      <h1 style={{ fontSize: '20px', marginTop: '-10px', marginBottom: '32px' }}>Грузчики за 10 минут</h1>
      
      <div className="container">
        <div className="form-card">
          <OrderForm />
        </div>
      </div>
    </div>
  );
}
