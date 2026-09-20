/**
 * AgroAI — Premium Mapbox Field Mapping Component
 * Integrates Mapbox GL JS + Mapbox Draw for interactive agricultural field boundaries & paths.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GeoLineString {
  type: 'LineString';
  coordinates: number[][];
}

export interface AgroMapProps {
  initialCenter?: [number, number]; // [lng, lat]
  initialZoom?: number;
  boundary?: GeoPolygon | null;
  path?: GeoLineString | null;
  readOnly?: boolean;
  onGeometrySave?: (boundary: GeoPolygon | null, path: GeoLineString | null) => void;
  fieldTitle?: string;
  height?: string;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

export const AgroMap: React.FC<AgroMapProps> = ({
  initialCenter = [-121.655, 36.677], // Salinas Valley default
  initialZoom = 14,
  boundary = null,
  path = null,
  readOnly = false,
  onGeometrySave,
  fieldTitle = 'Agricultural Field Map',
  height = '480px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);

  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets' | 'outdoors'>('satellite');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [drawnBoundary, setDrawnBoundary] = useState<GeoPolygon | null>(boundary);
  const [drawnPath, setDrawnPath] = useState<GeoLineString | null>(path);
  const [calculatedArea, setCalculatedArea] = useState<number | null>(null);

  const isMapboxReady = Boolean(MAPBOX_TOKEN.trim());

  // Calculate polygon area in acres (approximate algorithm)
  const computeAreaAcres = useCallback((coords: number[][]): number => {
    if (!coords || coords.length < 3) return 0;
    let areaSqM = 0;
    const radius = 6378137; // Earth radius
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const rad = (val: number) => (val * Math.PI) / 180;
      areaSqM +=
        (rad(p2[0]) - rad(p1[0])) *
        (2 + Math.sin(rad(p1[1])) + Math.sin(rad(p2[1])));
    }
    areaSqM = Math.abs((areaSqM * radius * radius) / 2);
    const acres = areaSqM / 4046.86;
    return Math.round(acres * 100) / 100;
  }, []);

  // Initialize Mapbox map instance
  useEffect(() => {
    if (!isMapboxReady || !mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const styleUri =
      mapStyle === 'satellite'
        ? 'mapbox://styles/mapbox/satellite-streets-v12'
        : mapStyle === 'streets'
        ? 'mapbox://styles/mapbox/streets-v12'
        : 'mapbox://styles/mapbox/outdoors-v12';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: styleUri,
      center: initialCenter,
      zoom: initialZoom,
      pitch: 30,
    });

    mapRef.current = map;

    // Add navigation and geolocation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    );

    // Initialize MapboxDraw
    if (!readOnly) {
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          line_string: true,
          trash: true,
        },
        defaultMode: 'simple_select',
      });
      map.addControl(draw as any, 'top-left');
      drawRef.current = draw;

      // Listen to draw events
      const updateGeometries = () => {
        const data = draw.getAll();
        let poly: GeoPolygon | null = null;
        let line: GeoLineString | null = null;

        data.features.forEach((feat: any) => {
          if (feat.geometry.type === 'Polygon') {
            poly = feat.geometry as GeoPolygon;
            if (poly.coordinates[0]) {
              setCalculatedArea(computeAreaAcres(poly.coordinates[0]));
            }
          } else if (feat.geometry.type === 'LineString') {
            line = feat.geometry as GeoLineString;
          }
        });

        setDrawnBoundary(poly);
        setDrawnPath(line);
      };

      map.on('draw.create', updateGeometries);
      map.on('draw.update', updateGeometries);
      map.on('draw.delete', updateGeometries);
    }

    // Load initial boundary and path on map load
    map.on('load', () => {
      if (boundary && boundary.coordinates && boundary.coordinates.length > 0) {
        map.addSource('initial-boundary-src', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: boundary as any,
            properties: {},
          },
        });
        map.addLayer({
          id: 'initial-boundary-fill',
          type: 'fill',
          source: 'initial-boundary-src',
          paint: {
            'fill-color': '#2d6a4f',
            'fill-opacity': 0.35,
          },
        });
        map.addLayer({
          id: 'initial-boundary-line',
          type: 'line',
          source: 'initial-boundary-src',
          paint: {
            'line-color': '#52b788',
            'line-width': 3,
          },
        });

        // Calculate initial area
        if (boundary.coordinates[0]) {
          setCalculatedArea(computeAreaAcres(boundary.coordinates[0]));
        }
      }

      if (path && path.coordinates && path.coordinates.length > 0) {
        map.addSource('initial-path-src', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: path as any,
            properties: {},
          },
        });
        map.addLayer({
          id: 'initial-path-line',
          type: 'line',
          source: 'initial-path-src',
          paint: {
            'line-color': '#e9c46a',
            'line-width': 4,
            'line-dasharray': [2, 1],
          },
        });
      }

      // Add center marker
      new mapboxgl.Marker({ color: '#2d6a4f' })
        .setLngLat(initialCenter)
        .setPopup(new mapboxgl.Popup().setHTML(`<strong>${fieldTitle}</strong>`))
        .addTo(map);
    });

    return () => {
      map.remove();
    };
  }, [isMapboxReady, mapStyle, readOnly]);

  // Style change handler
  const handleStyleChange = (newStyle: 'satellite' | 'streets' | 'outdoors') => {
    setMapStyle(newStyle);
    if (mapRef.current) {
      const uri =
        newStyle === 'satellite'
          ? 'mapbox://styles/mapbox/satellite-streets-v12'
          : newStyle === 'streets'
          ? 'mapbox://styles/mapbox/streets-v12'
          : 'mapbox://styles/mapbox/outdoors-v12';
      mapRef.current.setStyle(uri);
    }
  };

  // Location Search via Mapbox Geocoding API
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !MAPBOX_TOKEN) return;

    setSearching(true);
    setSearchError('');
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchQuery
      )}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 1500 });
          new mapboxgl.Marker({ color: '#e76f51' })
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup().setHTML(`<div>${data.features[0].place_name}</div>`))
            .addTo(mapRef.current);
        }
      } else {
        setSearchError('Location not found. Try a different search term.');
      }
    } catch {
      setSearchError('Failed to search location.');
    } finally {
      setSearching(false);
    }
  };

  // Save drawing handler
  const handleSaveClick = () => {
    if (onGeometrySave) {
      onGeometrySave(drawnBoundary, drawnPath);
    }
  };

  // If Mapbox token is missing, show safe configuration message
  if (!isMapboxReady) {
    return (
      <div
        className="w-full rounded-xl border border-amber-200 bg-amber-50 p-space-md flex flex-col gap-space-sm text-amber-900 font-body-sm shadow-sm"
        style={{ height }}
      >
        <div className="flex items-center gap-space-xs font-semibold text-headline-sm">
          <span className="material-symbols-outlined text-amber-700">map</span>
          <span>Mapbox Token Pending Configuration</span>
        </div>
        <p>
          Interactive Mapbox GL JS agricultural mapping requires a valid Mapbox Access Token.
        </p>
        <div className="bg-white/80 p-space-sm rounded-lg border border-amber-300 font-data-mono text-xs text-amber-950">
          VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1Ijoi... inside frontend/.env
        </div>
        {boundary && boundary.coordinates && (
          <div className="mt-auto pt-space-xs border-t border-amber-200 flex items-center justify-between text-xs text-amber-800">
            <span>Saved Polygon Points: {boundary.coordinates[0]?.length || 0}</span>
            <span>Fallback Map Simulation Active</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-xs w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
      {/* Map Control Bar */}
      <div className="px-space-md py-space-xs bg-surface-container flex flex-wrap items-center justify-between gap-space-sm border-b border-outline-variant/30 text-on-surface">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-secondary text-[20px]">layers</span>
          <span className="font-headline-sm text-headline-sm text-on-surface">{fieldTitle}</span>
          {calculatedArea !== null && calculatedArea > 0 && (
            <span className="ml-2 font-data-mono text-label-sm bg-primary-container text-on-primary px-2 py-0.5 rounded font-semibold">
              Area: {calculatedArea} Acres
            </span>
          )}
        </div>

        <div className="flex items-center gap-space-xs flex-wrap">
          {/* Map Style Selector */}
          <div className="flex items-center bg-surface rounded-lg p-0.5 shadow-xs border border-outline-variant/40">
            <button
              type="button"
              onClick={() => handleStyleChange('satellite')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                mapStyle === 'satellite'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('streets')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                mapStyle === 'streets'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => handleStyleChange('outdoors')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                mapStyle === 'outdoors'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Terrain
            </button>
          </div>

          {/* Draw Save Button */}
          {!readOnly && onGeometrySave && (
            <button
              type="button"
              onClick={handleSaveClick}
              className="h-8 px-3 rounded-lg bg-secondary text-on-secondary font-headline-sm text-xs hover:bg-secondary-container hover:text-on-secondary-container transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Boundary & Path</span>
            </button>
          )}
        </div>
      </div>

      {/* Location Search Bar */}
      <form onSubmit={handleSearch} className="px-space-md py-1.5 bg-surface flex items-center gap-space-xs border-b border-outline-variant/20">
        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
        <input
          type="text"
          placeholder="Search location (e.g., Salinas, CA or lat, lng)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant/60"
        />
        <button
          type="submit"
          disabled={searching}
          className="text-xs font-semibold text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          {searching ? 'Locating...' : 'Search'}
        </button>
      </form>
      {searchError && (
        <div className="px-space-md py-1 bg-error-container text-on-error-container text-xs font-label-sm">
          {searchError}
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full relative" style={{ height }} />
    </div>
  );
};
