/**
 * AgroAI — Premium Agricultural GIS & Mapbox Field Mapping Component
 * Integrates Mapbox GL JS + Mapbox Draw for interactive agricultural field boundaries & paths,
 * with an interactive Vector GIS & Satellite Canvas fallback when Mapbox token is not configured.
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

// Read token from environment variable or user localStorage
function getStoredToken(): string {
  const envToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
  if (envToken.trim()) return envToken.trim();
  if (typeof window !== 'undefined') {
    return localStorage.getItem('agroai_mapbox_token') || '';
  }
  return '';
}

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
  const [mapboxToken, setMapboxToken] = useState<string>(getStoredToken);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [tokenInput, setTokenInput] = useState(mapboxToken);

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

  // Vector GIS Canvas Fallback state
  const [gisZoom, setGisZoom] = useState(1);
  const [gisPan, setGisPan] = useState({ x: 0, y: 0 });
  const [gisDragging, setGisDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [gisViewMode, setGisViewMode] = useState<'satellite' | 'topo'>('satellite');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState('');

  // Keep local geometry synced if props change
  useEffect(() => {
    setDrawnBoundary(boundary);
  }, [boundary]);

  useEffect(() => {
    setDrawnPath(path);
  }, [path]);

  const isMapboxReady = Boolean(mapboxToken.trim());

  // Calculate polygon area in acres (approximate geodesic algorithm)
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

  // Update area when boundary changes
  useEffect(() => {
    if (drawnBoundary?.coordinates?.[0]?.length) {
      setCalculatedArea(computeAreaAcres(drawnBoundary.coordinates[0]));
    }
  }, [drawnBoundary, computeAreaAcres]);

  // Handle Token Save
  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = tokenInput.trim();
    if (cleanToken) {
      localStorage.setItem('agroai_mapbox_token', cleanToken);
      setMapboxToken(cleanToken);
    } else {
      localStorage.removeItem('agroai_mapbox_token');
      setMapboxToken('');
    }
    setShowTokenDialog(false);
  };

  // Initialize Mapbox map instance when token is present
  useEffect(() => {
    if (!isMapboxReady || !mapContainerRef.current) return;

    try {
      mapboxgl.accessToken = mapboxToken;

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

        map.on('load', () => {
          if (drawnBoundary) {
            draw.add({
              type: 'Feature',
              properties: {},
              geometry: drawnBoundary,
            });
            if (drawnBoundary.coordinates[0]) {
              setCalculatedArea(computeAreaAcres(drawnBoundary.coordinates[0]));
            }
          }
          if (drawnPath) {
            draw.add({
              type: 'Feature',
              properties: {},
              geometry: drawnPath,
            });
          }
        });
      }

      map.on('load', () => {
        // Read-only static overlay
        if (readOnly && drawnBoundary) {
          map.addSource('field-polygon', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: drawnBoundary,
            },
          });

          map.addLayer({
            id: 'field-polygon-fill',
            type: 'fill',
            source: 'field-polygon',
            paint: {
              'fill-color': '#2a9d8f',
              'fill-opacity': 0.35,
            },
          });

          map.addLayer({
            id: 'field-polygon-line',
            type: 'line',
            source: 'field-polygon',
            paint: {
              'line-color': '#2a9d8f',
              'line-width': 3,
            },
          });
        }

        if (readOnly && drawnPath) {
          map.addSource('field-path', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: drawnPath,
            },
          });

          map.addLayer({
            id: 'field-path-line',
            type: 'line',
            source: 'field-path',
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
    } catch (err) {
      console.warn('Mapbox initialization error, falling back to GIS canvas:', err);
    }
  }, [isMapboxReady, mapboxToken, mapStyle, readOnly, computeAreaAcres, initialCenter, initialZoom, fieldTitle]);

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
    if (!searchQuery.trim() || !mapboxToken) return;

    setSearching(true);
    setSearchError('');
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchQuery
      )}.json?access_token=${mapboxToken}&limit=1`;
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
      setSaveSuccessNotice('Boundary geometry saved successfully!');
      setTimeout(() => setSaveSuccessNotice(''), 2500);
    }
  };

  // ─── Vector GIS Math & Canvas Fallback Calculations ──────────────────────────
  const activePolygonCoords = useMemo(() => {
    if (drawnBoundary?.coordinates?.[0]?.length) {
      return drawnBoundary.coordinates[0];
    }
    // Default polygon around initial center if no coordinates saved yet
    const [cLng, cLat] = initialCenter;
    const delta = 0.0035;
    return [
      [cLng - delta, cLat - delta * 0.8],
      [cLng + delta * 0.9, cLat - delta * 0.9],
      [cLng + delta * 1.1, cLat + delta * 0.7],
      [cLng - delta * 0.8, cLat + delta * 1.0],
      [cLng - delta, cLat - delta * 0.8],
    ];
  }, [drawnBoundary, initialCenter]);

  const activePathCoords = useMemo(() => {
    if (drawnPath?.coordinates?.length) {
      return drawnPath.coordinates;
    }
    return null;
  }, [drawnPath]);

  // Compute SVG projection bounds
  const svgProjection = useMemo(() => {
    const allCoords = [...activePolygonCoords, ...(activePathCoords || [])];
    if (allCoords.length === 0) {
      return {
        minLng: 0,
        maxLng: 100,
        minLat: 0,
        maxLat: 100,
        project: (_lng: number, _lat: number): [number, number] => [400, 250],
        unproject: (_x: number, _y: number): [number, number] => [initialCenter[0], initialCenter[1]],
      };
    }

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    allCoords.forEach(([lng, lat]) => {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });

    const padLng = Math.max((maxLng - minLng) * 0.35, 0.001);
    const padLat = Math.max((maxLat - minLat) * 0.35, 0.001);

    const bMinLng = minLng - padLng;
    const bMaxLng = maxLng + padLng;
    const bMinLat = minLat - padLat;
    const bMaxLat = maxLat + padLat;

    const width = 800;
    const heightNum = 500;

    const project = (lng: number, lat: number): [number, number] => {
      const x = ((lng - bMinLng) / (bMaxLng - bMinLng)) * width;
      // Invert Y for SVG coordinates
      const y = heightNum - ((lat - bMinLat) / (bMaxLat - bMinLat)) * heightNum;
      return [x, y];
    };

    const unproject = (x: number, y: number): [number, number] => {
      const lng = bMinLng + (x / width) * (bMaxLng - bMinLng);
      const lat = bMinLat + ((heightNum - y) / heightNum) * (bMaxLat - bMinLat);
      return [Number(lng.toFixed(6)), Number(lat.toFixed(6))];
    };

    return { minLng, maxLng, minLat, maxLat, project, unproject };
  }, [activePolygonCoords, activePathCoords]);

  // Handle canvas click to add points when in edit mode
  const handleGisCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - gisPan.x) / gisZoom;
    const clickY = (e.clientY - rect.top - gisPan.y) / gisZoom;
    const [newLng, newLat] = svgProjection.unproject(clickX, clickY);

    const currentCoords = drawnBoundary?.coordinates?.[0] ? [...drawnBoundary.coordinates[0]] : [];
    if (currentCoords.length > 0 && currentCoords[0][0] === currentCoords[currentCoords.length - 1][0]) {
      // Remove closing point before pushing
      currentCoords.pop();
    }
    currentCoords.push([newLng, newLat]);
    // Close polygon
    const closed = [...currentCoords, currentCoords[0]];
    const updatedPoly: GeoPolygon = {
      type: 'Polygon',
      coordinates: [closed],
    };
    setDrawnBoundary(updatedPoly);
    setCalculatedArea(computeAreaAcres(closed));
  };

  const handleClearBoundary = () => {
    setDrawnBoundary(null);
    setCalculatedArea(0);
  };

  const handleResetDefaultBoundary = () => {
    const [cLng, cLat] = initialCenter;
    const delta = 0.0035;
    const defaultCoords = [
      [cLng - delta, cLat - delta * 0.8],
      [cLng + delta * 0.9, cLat - delta * 0.9],
      [cLng + delta * 1.1, cLat + delta * 0.7],
      [cLng - delta * 0.8, cLat + delta * 1.0],
      [cLng - delta, cLat - delta * 0.8],
    ];
    const newPoly: GeoPolygon = {
      type: 'Polygon',
      coordinates: [defaultCoords],
    };
    setDrawnBoundary(newPoly);
    setCalculatedArea(computeAreaAcres(defaultCoords));
  };

  // Convert polygon coordinates to SVG points string
  const polygonSvgPoints = useMemo(() => {
    return activePolygonCoords
      .map(([lng, lat]) => {
        const [x, y] = svgProjection.project(lng, lat);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activePolygonCoords, svgProjection]);

  // Convert path coordinates to SVG points string
  const pathSvgPoints = useMemo(() => {
    if (!activePathCoords) return '';
    return activePathCoords
      .map(([lng, lat]) => {
        const [x, y] = svgProjection.project(lng, lat);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [activePathCoords, svgProjection]);

  // Calculate centroid for pin marker
  const centroid = useMemo(() => {
    let sumX = 0, sumY = 0;
    activePolygonCoords.forEach(([lng, lat]) => {
      const [x, y] = svgProjection.project(lng, lat);
      sumX += x;
      sumY += y;
    });
    const len = activePolygonCoords.length || 1;
    return [sumX / len, sumY / len];
  }, [activePolygonCoords, svgProjection]);

  // ─── RENDER: Official Mapbox GL JS if token is present ────────────────────────
  if (isMapboxReady) {
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
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
              Mapbox GL JS Active
            </span>
          </div>

          <div className="flex items-center gap-space-xs flex-wrap">
            {/* Map Style Selector */}
            <div className="flex items-center bg-surface rounded-lg p-0.5 shadow-xs border border-outline-variant/40">
              <button
                type="button"
                onClick={() => handleStyleChange('satellite')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
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
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
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
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  mapStyle === 'outdoors'
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Terrain
              </button>
            </div>

            {/* Token Settings Button */}
            <button
              type="button"
              onClick={() => {
                setTokenInput(mapboxToken);
                setShowTokenDialog(true);
              }}
              className="h-8 px-2.5 rounded-lg bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors flex items-center gap-1 cursor-pointer"
              title="Configure Mapbox Token"
            >
              <span className="material-symbols-outlined text-[15px]">key</span>
              <span>Token</span>
            </button>

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

        {/* Token Modal */}
        {showTokenDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-surface-container-lowest w-full max-w-md p-space-lg rounded-xl shadow-2xl flex flex-col gap-space-md border border-outline-variant/30">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">map</span>
                  <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Mapbox Access Token</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTokenDialog(false)}
                  className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveToken} className="flex flex-col gap-3">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Enter your Mapbox Public Token (<code className="bg-surface-container px-1 rounded text-primary">pk.eyJ1...</code>) to enable high-resolution satellite imagery and interactive GIS drawing.
                </p>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-on-surface">Access Token</label>
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="pk.eyJ1..."
                    className="w-full bg-surface h-9 px-3 rounded-lg text-xs font-mono border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => {
                      setTokenInput('');
                      localStorage.removeItem('agroai_mapbox_token');
                      setMapboxToken('');
                      setShowTokenDialog(false);
                    }}
                    className="text-xs text-error font-semibold hover:underline cursor-pointer"
                  >
                    Clear Token (Use GIS Mode)
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTokenDialog(false)}
                      className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all cursor-pointer"
                    >
                      Save & Activate
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: High-Aesthetic Agricultural Vector GIS & Satellite Map ───────────
  return (
    <div className="flex flex-col gap-space-xs w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-outline-variant/30">
      {/* Top Banner & Control Bar */}
      <div className="px-space-md py-space-xs bg-surface-container flex flex-wrap items-center justify-between gap-space-sm border-b border-outline-variant/30 text-on-surface">
        <div className="flex items-center gap-space-xs flex-wrap">
          <span className="material-symbols-outlined text-secondary text-[20px]">terrain</span>
          <span className="font-headline-sm text-headline-sm text-on-surface">{fieldTitle}</span>
          
          <span className="font-data-mono text-label-sm bg-primary-container text-on-primary px-2 py-0.5 rounded font-semibold">
            {calculatedArea !== null && calculatedArea > 0
              ? `Area: ${calculatedArea} Acres`
              : `Points: ${activePolygonCoords.length}`}
          </span>

          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Interactive GIS Vector Mode</span>
          </span>
        </div>

        <div className="flex items-center gap-space-xs flex-wrap">
          {/* View Mode Toggle: Satellite Texture vs Topographic Grid */}
          <div className="flex items-center bg-surface rounded-lg p-0.5 shadow-xs border border-outline-variant/40">
            <button
              type="button"
              onClick={() => setGisViewMode('satellite')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                gisViewMode === 'satellite'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => setGisViewMode('topo')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                gisViewMode === 'topo'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Topo Grid
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-surface rounded-lg p-0.5 border border-outline-variant/40">
            <button
              type="button"
              onClick={() => setGisZoom((z) => Math.min(z + 0.25, 2.5))}
              className="w-7 h-7 flex items-center justify-center text-on-surface hover:bg-surface-container rounded font-bold cursor-pointer text-sm"
              title="Zoom In"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setGisZoom((z) => Math.max(z - 0.25, 0.6))}
              className="w-7 h-7 flex items-center justify-center text-on-surface hover:bg-surface-container rounded font-bold cursor-pointer text-sm"
              title="Zoom Out"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => {
                setGisZoom(1);
                setGisPan({ x: 0, y: 0 });
              }}
              className="px-2 h-7 flex items-center justify-center text-[10px] text-on-surface-variant hover:bg-surface-container rounded font-medium cursor-pointer"
              title="Reset View"
            >
              Reset
            </button>
          </div>

          {/* Mapbox Token Configuration Button */}
          <button
            type="button"
            onClick={() => {
              setTokenInput(mapboxToken);
              setShowTokenDialog(true);
            }}
            className="h-8 px-2.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 text-xs font-semibold hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Configure Mapbox Token"
          >
            <span className="material-symbols-outlined text-[15px]">key</span>
            <span>Configure Mapbox</span>
          </button>

          {/* Drawing Controls when not readOnly */}
          {!readOnly && (
            <>
              <button
                type="button"
                onClick={handleResetDefaultBoundary}
                className="h-8 px-2.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                title="Reset to standard farm sector boundary"
              >
                Default Parcel
              </button>

              <button
                type="button"
                onClick={handleClearBoundary}
                className="h-8 px-2.5 rounded-lg bg-error-container text-on-error-container text-xs font-semibold hover:opacity-90 transition-colors cursor-pointer"
                title="Clear boundary vertices"
              >
                Clear
              </button>

              {onGeometrySave && (
                <button
                  type="button"
                  onClick={handleSaveClick}
                  className="h-8 px-3 rounded-lg bg-primary text-on-primary font-headline-sm text-xs hover:bg-primary-container transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Save Boundary</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Status / Drawing instructions sub-bar */}
      <div className="px-space-md py-1.5 bg-surface flex items-center justify-between text-xs text-on-surface-variant border-b border-outline-variant/20">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-secondary">
            Sector Lat/Lng: [{initialCenter[1].toFixed(4)}° N, {initialCenter[0].toFixed(4)}° W]
          </span>
          {!readOnly && (
            <span className="hidden sm:inline text-on-surface-variant/80">
              • Click on map to plot polygon boundary points
            </span>
          )}
        </div>
        {saveSuccessNotice && (
          <span className="text-primary font-bold animate-in fade-in flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">check_circle</span>
            <span>{saveSuccessNotice}</span>
          </span>
        )}
      </div>

      {/* SVG GIS Agricultural Map Canvas */}
      <div
        className="w-full relative overflow-hidden select-none bg-stone-900 cursor-crosshair"
        style={{ height }}
        onMouseDown={(e) => {
          if (e.button === 0 && e.shiftKey) {
            setGisDragging(true);
            setDragStart({ x: e.clientX - gisPan.x, y: e.clientY - gisPan.y });
          }
        }}
        onMouseMove={(e) => {
          if (gisDragging) {
            setGisPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
          }
        }}
        onMouseUp={() => setGisDragging(false)}
        onMouseLeave={() => setGisDragging(false)}
      >
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          onClick={handleGisCanvasClick}
        >
          <defs>
            {/* Field Green Translucent Gradient */}
            <linearGradient id="agroFieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.2" />
            </linearGradient>

            {/* Crop Row Pattern */}
            <pattern id="cropRows" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(25)">
              <line x1="0" y1="0" x2="0" y2="20" stroke="#047857" strokeWidth="1.5" strokeOpacity="0.4" />
            </pattern>

            {/* Satellite Terrain Grid Pattern */}
            <pattern id="gisGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.7" strokeOpacity="0.35" />
            </pattern>

            {/* Soil Texture Gradient */}
            <radialGradient id="satelliteSoilGrad" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="60%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
          </defs>

          {/* Map Base Surface */}
          <rect
            width="800"
            height="500"
            fill={gisViewMode === 'satellite' ? 'url(#satelliteSoilGrad)' : '#0f172a'}
          />

          <g transform={`translate(${gisPan.x}, ${gisPan.y}) scale(${gisZoom})`}>
            {/* Agricultural Grid & Contour Lines */}
            <rect width="800" height="500" fill="url(#gisGrid)" />

            {/* Ambient Farmland Surrounding Plots (visual realism) */}
            <rect x="60" y="60" width="280" height="180" rx="6" fill="#14532d" fillOpacity="0.12" stroke="#15803d" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="4 4" />
            <rect x="420" y="240" width="310" height="200" rx="8" fill="#1e3a8a" fillOpacity="0.08" stroke="#3b82f6" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="3 3" />
            <rect x="480" y="70" width="240" height="140" rx="4" fill="#713f12" fillOpacity="0.1" stroke="#a16207" strokeWidth="0.8" strokeOpacity="0.2" />

            {/* Active Field Parcel Fill with Crop Row Lines */}
            {polygonSvgPoints && (
              <>
                <polygon
                  points={polygonSvgPoints}
                  fill="url(#agroFieldGrad)"
                  stroke="#10b981"
                  strokeWidth="3"
                  className="transition-all"
                  style={{ filter: 'drop-shadow(0px 4px 12px rgba(16, 185, 129, 0.3))' }}
                />
                <polygon
                  points={polygonSvgPoints}
                  fill="url(#cropRows)"
                  pointerEvents="none"
                />
                {/* Neon Dashed Border */}
                <polygon
                  points={polygonSvgPoints}
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  pointerEvents="none"
                />
              </>
            )}

            {/* Path / Tractor Route if defined */}
            {pathSvgPoints && (
              <>
                <polyline
                  points={pathSvgPoints}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeDasharray="8 5"
                />
                {activePathCoords?.map(([pLng, pLat], idx) => {
                  const [px, py] = svgProjection.project(pLng, pLat);
                  return (
                    <g key={idx} transform={`translate(${px}, ${py})`}>
                      <circle r="5" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
                      <text y="14" textAnchor="middle" fill="#fef3c7" fontSize="9" fontWeight="bold" fontFamily="monospace">
                        WP{idx + 1}
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* Field Polygon Vertices Pins */}
            {activePolygonCoords.map(([vLng, vLat], idx) => {
              if (idx === activePolygonCoords.length - 1 && activePolygonCoords.length > 1) return null; // Skip duplicate closing point
              const [vx, vy] = svgProjection.project(vLng, vLat);
              return (
                <g key={idx} transform={`translate(${vx}, ${vy})`}>
                  <circle r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" className="cursor-pointer" />
                  <circle r="3" fill="#047857" pointerEvents="none" />
                  <text
                    y="-10"
                    textAnchor="middle"
                    fill="#a7f3d0"
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    pointerEvents="none"
                  >
                    P{idx + 1}
                  </text>
                </g>
              );
            })}

            {/* Field Centroid Marker & Label */}
            <g transform={`translate(${centroid[0]}, ${centroid[1]})`}>
              <circle r="12" fill="#065f46" stroke="#34d399" strokeWidth="2" />
              <text y="4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                🌾
              </text>
              <rect x="-60" y="-36" width="120" height="22" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
              <text y="-22" textAnchor="middle" fill="#ecfdf5" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                {fieldTitle}
              </text>
            </g>
          </g>

          {/* Compass Rose & HUD Info (Screen Space) */}
          <g transform="translate(750, 50)">
            <circle r="22" fill="#0f172a" fillOpacity="0.85" stroke="#475569" strokeWidth="1" />
            <polygon points="0,-16 -5,0 0,-4" fill="#ef4444" />
            <polygon points="0,16 5,0 0,4" fill="#94a3b8" />
            <polygon points="0,-16 5,0 0,-4" fill="#b91c1c" />
            <polygon points="0,16 -5,0 0,4" fill="#64748b" />
            <text y="-7" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="bold">N</text>
          </g>

          {/* Legend / Coordinate Footprint in Bottom Left */}
          <g transform="translate(18, 475)">
            <rect x="0" y="-18" width="220" height="24" rx="4" fill="#0f172a" fillOpacity="0.85" stroke="#334155" strokeWidth="0.8" />
            <text x="8" y="-3" fill="#94a3b8" fontSize="10" fontFamily="monospace">
              GIS WGS84: {initialCenter[1].toFixed(3)}°N, {initialCenter[0].toFixed(3)}°W
            </text>
          </g>
        </svg>

        {/* Floating Quick Action Overlay */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-xs p-1.5 rounded-lg border border-outline-variant/30 text-xs">
          <span className="text-on-surface-variant font-medium text-[11px] px-1">
            {drawnBoundary ? `${drawnBoundary.coordinates[0]?.length || 0} vertices` : 'Ready to draw'}
          </span>
          <button
            type="button"
            onClick={() => {
              setTokenInput(mapboxToken);
              setShowTokenDialog(true);
            }}
            className="px-2 py-1 rounded bg-primary text-on-primary font-semibold text-[11px] hover:bg-primary-container transition-all cursor-pointer"
          >
            Enter Mapbox Token
          </button>
        </div>
      </div>

      {/* Token Modal */}
      {showTokenDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-container-lowest w-full max-w-md p-space-lg rounded-xl shadow-2xl flex flex-col gap-space-md border border-outline-variant/30 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-[22px]">map</span>
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">Mapbox Access Token</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTokenDialog(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveToken} className="flex flex-col gap-3">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Paste your Mapbox Public Token (<code className="bg-surface-container px-1 rounded text-primary font-bold">pk.eyJ1...</code>) to activate official Mapbox GL JS 3D Satellite Streets and polygon drawing tools.
              </p>

              <div className="p-2.5 rounded-lg bg-surface border border-outline-variant/20 text-[11px] text-on-surface-variant flex flex-col gap-1">
                <span className="font-semibold text-secondary">Where to find your token:</span>
                <span>1. Sign up or log in at <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-semibold">mapbox.com/access-tokens</a></span>
                <span>2. Copy your <strong>Default public token</strong></span>
                <span>3. Paste it below or save inside <code className="font-mono text-on-surface font-semibold">frontend/.env</code> as <code className="font-mono text-on-surface font-semibold">VITE_MAPBOX_ACCESS_TOKEN</code></span>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface">Access Token</label>
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="pk.eyJ1..."
                  className="w-full bg-surface h-9 px-3 rounded-lg text-xs font-mono border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => {
                    setTokenInput('');
                    localStorage.removeItem('agroai_mapbox_token');
                    setMapboxToken('');
                    setShowTokenDialog(false);
                  }}
                  className="text-xs text-error font-semibold hover:underline cursor-pointer"
                >
                  Reset Token
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTokenDialog(false)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all cursor-pointer"
                  >
                    Save & Enable Mapbox
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
