'use client';
import { useEffect, useRef } from 'react';

export default function YandexMap({ onAddressSelect }: { onAddressSelect: (address: string, lat: number, lng: number) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const placemarkRef = useRef<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YMAPS_KEY}&lang=ru_RU`;
    script.onload = () => {
      (window as any).ymaps.ready(() => {
        const map = new (window as any).ymaps.Map(mapRef.current, {
          center: [55.751574, 37.573856],
          zoom: 10
        });
        
        map.events.add('click', async (e: any) => {
          const coords = e.get('coords');
          if (placemarkRef.current) map.geoObjects.remove(placemarkRef.current);
          placemarkRef.current = new (window as any).ymaps.Placemark(coords);
          map.geoObjects.add(placemarkRef.current);
          
          const res = await (window as any).ymaps.geocode(coords);
          const address = res.geoObjects.get(0).getAddressLine();
          onAddressSelect(address, coords[0], coords[1]);
        });
      });
    };
    document.head.appendChild(script);
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
}
