import React, { useEffect, useState, useCallback } from 'react';
import Map, { Source, Layer, useMap } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin } from 'lucide-react';

const MAPLIBRE_STYLE = 'https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json';

function CurrentLocationButton() {
  const { current: map } = useMap();

  const handleClick = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map?.flyTo({
            center: [position.coords.longitude, position.coords.latitude],
            zoom: 14,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('現在地を取得できませんでした。位置情報の許可を確認してください。');
        }
      );
    } else {
      alert('お使いのブラウザは位置情報をサポートしていません。');
    }
  }, [map]);

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-4 right-4 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors"
      aria-label="現在地に移動"
    >
      <MapPin size={24} />
    </button>
  );
}

function App() {
  const [shrines, setShrines] = useState<GeoJSON.FeatureCollection>({
    type: 'FeatureCollection',
    features: [],
  });

  useEffect(() => {
    const fetchShrines = async () => {
      const query = `
        [out:json];
        area["ISO3166-1"="JP"][admin_level=2];
        node["historic"="wayside_shrine"](area);
        out;
      `;
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
      });
      const data = await response.json();
      
      const features = data.elements.map((element: any) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [element.lon, element.lat],
        },
        properties: {
          id: element.id,
          name: element.tags.name,
        },
      }));

      setShrines({
        type: 'FeatureCollection',
        features,
      });
    };

    fetchShrines();
  }, []);

  return (
    <div className="h-screen w-full relative">
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-80 p-2 rounded shadow">
        <p className="font-bold text-lg">祠の総数: {shrines.features.length}</p>
      </div>
      <Map
        mapLib={maplibregl}
        initialViewState={{
          longitude: 138.2529,
          latitude: 36.2048,
          zoom: 5,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAPLIBRE_STYLE}
      >
        <Source id="shrines" type="geojson" data={shrines}>
          <Layer
            id="shrine-layer"
            type="circle"
            paint={{
              'circle-radius': 4,
              'circle-color': '#FF0000',
            }}
          />
        </Source>
        <CurrentLocationButton />
      </Map>
    </div>
  );
}

export default App;