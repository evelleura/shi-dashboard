'use client';

import dynamic from 'next/dynamic';

const MapPreviewInner = dynamic(() => import('./MapPreviewInner'), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center" style={{ height: '200px' }}>
      <span className="text-sm text-gray-400">Memuat peta...</span>
    </div>
  ),
});

interface MapPreviewProps {
  lat: number;
  lng: number;
  height?: string;
}

export default function MapPreview({ lat, lng, height }: MapPreviewProps) {
  return <MapPreviewInner lat={lat} lng={lng} height={height} />;
}
