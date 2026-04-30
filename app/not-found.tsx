import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>404 - Страница не найдена</h1>
      <p>Вернуться на <Link href="/">главную</Link></p>
    </div>
  );
}
