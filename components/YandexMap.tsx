'use client';
import { useEffect, useRef, useState } from 'react';

export default function YandexMap({ address, onAddressSelect }: { address: string; onAddressSelect: (address: string, lat: number, lng: number) => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const placemarkRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Загрузка карты
  useEffect(() => {
    if (!mapRef.current) return;

    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${process.env.NEXT_PUBLIC_YMAPS_KEY}&lang=ru_RU`;
    script.onload = () => {
      (window as any).ymaps.ready(() => {
        const map = new (window as any).ymaps.Map(mapRef.current, {
          center: [55.441, 65.341],
          zoom: 12
        });
        mapInstanceRef.current = map;
        
        map.events.add('click', async (e: any) => {
          const coords = e.get('coords');
          if (placemarkRef.current) map.geoObjects.remove(placemarkRef.current);
          placemarkRef.current = new (window as any).ymaps.Placemark(coords);
          map.geoObjects.add(placemarkRef.current);
          
          const res = await (window as any).ymaps.geocode(coords);
          const addressText = res.geoObjects.get(0).getAddressLine();
          onAddressSelect(addressText, coords[0], coords[1]);
        });
      });
    };
    document.head.appendChild(script);
  }, []);

  // Поиск подсказок при вводе адреса
  useEffect(() => {
    if (address.length < 3) {
      setSuggestions([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://geocode-maps.yandex.ru/1.x/?apikey=${process.env.NEXT_PUBLIC_YMAPS_KEY}&geocode=${encodeURIComponent(address)}&format=json`
        );
        const data = await response.json();
        const items = data.response.GeoObjectCollection.featureMember.map((item: any) => ({
          text: item.GeoObject.metaDataProperty.GeocoderMetaData.text,
          coords: item.GeoObject.Point.pos.split(' ').reverse()
        }));
        setSuggestions(items.slice(0, 5));
      } catch (error) {
        console.error('Ошибка поиска', error);
      }
    }, 500);

    return () => clearTimeout(delay);
  }, [address]);

  const selectSuggestion = (sugg: any) => {
    onAddressSelect(sugg.text, sugg.coords[0], sugg.coords[1]);
    setSuggestions([]);
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(sugg.coords, 15);
      if (placemarkRef.current) mapInstanceRef.current.geoObjects.remove(placemarkRef.current);
      placemarkRef.current = new (window as any).ymaps.Placemark(sugg.coords);
      mapInstanceRef.current.geoObjects.add(placemarkRef.current);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          placeholder="Введите адрес"
          value={address}
          onChange={(e) => onAddressSelect(e.target.value, 0, 0)}
          className="input-style w-full"
        />
        {suggestions.length > 0 && (
          <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-auto">
            {suggestions.map((s, i) => (
              <div key={i} onClick={() => selectSuggestion(s)} className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                {s.text}
              </div>
            ))}
          </div>
        )}
      </div>
      <div ref={mapRef} className="h-64 rounded-xl overflow-hidden border border-gray-200"></div>
    </div>
  );
}
