import React, { useState, useRef, Suspense, lazy, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import MapServiceDropdown from '@/components/Map/MapServiceDropdown';
import AddressSearchBar from '@/components/Map/AddressSearchBar';
import { MapPinIcon, Navigation, Globe, Signal, Wifi, Zap, Shield, Star, Layers, FileText, X, Bookmark, Save, History, Play } from 'lucide-react';
import { useGpsLocation } from '@/hooks/useGpsLocation';
import { lazyWithPreload } from '@/lib/lazyWithPreload';
import type { FreeMapContainerRef } from '@/components/Map/FreeMapContainer';
import type { FreeMapContainerProps } from '@/components/Map/FreeMapContainer';
import { getStateFromUrl, setStateInUrl } from '@/lib/urlState';

// Lazy load heavy components
const FreeMapContainer = lazyWithPreload(() => import('@/components/Map/FreeMapContainer'));
const MeasurementToolbar = lazyWithPreload(() => import('@/components/Toolbar/MeasurementToolbar'));
const PropertyPanel = lazyWithPreload(() => import('@/components/PropertyInfo/PropertyPanel'));
const AsphaltDetector = lazyWithPreload(() => import('@/components/Map/AsphaltDetector'));
const EnhancedAsphaltDetector = lazyWithPreload(() => import('@/components/Map/EnhancedAsphaltDetector'));
const OverlayManager = lazyWithPreload(() => import('@/components/Map/OverlayManager'));
const PrintComposer = lazyWithPreload(() => import('@/components/Map/PrintComposer'));

const ServiceInfo = lazyWithPreload(() => import('@/components/ServiceInfo/ServiceInfo'));

const Index = () => {
  const [activeTool, setActiveTool] = useState('select');
  const [currentMeasurement, setCurrentMeasurement] = useState<{ distance?: number; area?: number }>();
  const [propertyPanelOpen, setPropertyPanelOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<unknown>(null);
  const [selectedMapService, setSelectedMapService] = useState('esri-satellite');
  const [layerStates, setLayerStates] = useState({
    satellite: true,
    roads: true,
    labels: true,
    property: false
  });
  const [workspaceName, setWorkspaceName] = useState('default');

  const [showAsphaltDetector, setShowAsphaltDetector] = useState(false);
  const [showPrintComposer, setShowPrintComposer] = useState(false);

  // Map reference for communication with map component
  const mapRef = useRef<FreeMapContainerRef | null>(null);
  
  // GPS location hook
  const { location: gpsLocation, isLoading: gpsLoading, requestLocation, isSupported: gpsSupported } = useGpsLocation(false);

  // Request location once per session
  useEffect(() => {
    try {
      const hasRequested = sessionStorage.getItem('gps-requested');
      if (!hasRequested && gpsSupported) {
        requestLocation();
        sessionStorage.setItem('gps-requested', '1');
      }
    } catch {}
  }, [gpsSupported, requestLocation]);

  const [directionsMeta, setDirectionsMeta] = useState<{ distanceText?: string; durationText?: string } | null>(null);

  // Hydrate selected map service from localStorage
  useEffect(() => {
    try {
      // URL state has priority if present
      const urlState = getStateFromUrl();
      if (urlState) {
        if (urlState.svc) setSelectedMapService(urlState.svc);
        if (urlState.layers) setLayerStates(prev => ({ ...prev, ...urlState.layers }));
        // Defer map centering to first render where mapRef is ready
        const id = window.setTimeout(() => {
          try {
            const map = mapRef.current?.getMap?.();
            if (map) {
              map.setView([urlState.lat, urlState.lng] as any, urlState.z);
            }
          } catch {}
        }, 0);
        return () => window.clearTimeout(id);
      } else {
        const stored = localStorage.getItem('selected-map-service');
        if (stored) setSelectedMapService(stored);
      }
    } catch {
      // localStorage not available or blocked; ignore persistence
    }
  }, []);

  // Persist selected map service
  useEffect(() => {
    try {
      localStorage.setItem('selected-map-service', selectedMapService);
    } catch {
      // localStorage not available or blocked; ignore persistence
    }
  }, [selectedMapService]);

  // Keep URL state in sync when map/layers/service change
  useEffect(() => {
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    setStateInUrl({ lat: center.lat, lng: center.lng, z: zoom, svc: selectedMapService, layers: layerStates }, true);
  }, [selectedMapService, layerStates]);

  const handleMeasurement = useCallback((measurement: { distance?: number; area?: number }) => {
    setCurrentMeasurement(measurement);
  }, []);

  const handleLocationSearch = useCallback((lat: number, lng: number, address: string) => {
    if (mapRef.current && mapRef.current.handleLocationSearch) {
      mapRef.current.handleLocationSearch(lat, lng, address);
    }
  }, []);

  const handleGetDirections = useCallback(async (lat: number, lng: number, address: string) => {
    if (!gpsLocation) {
      toast.info('Getting your current location first...');
      requestLocation();
      return;
    }
    try {
      const res = await computeDirections(
        { lat: gpsLocation.latitude, lng: gpsLocation.longitude },
        { lat, lng },
        'DRIVING'
      );
      if (res && mapRef.current?.showRoute) {
        mapRef.current.showRoute(res.polyline, { distanceText: res.distanceText, durationText: res.durationText });
        setDirectionsMeta({ distanceText: res.distanceText, durationText: res.durationText });
      } else {
        toast.error('No route found');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to compute directions');
    }
  }, [gpsLocation, requestLocation]);

  const handleLayerToggle = useCallback((layerId: string) => {
    if (mapRef.current && mapRef.current.toggleLayer) {
      mapRef.current.toggleLayer(layerId);
      setLayerStates(prev => ({
        ...prev,
        [layerId]: !prev[layerId]
      }));
      // Update URL immediately after toggle
      try {
        const map = mapRef.current?.getMap?.();
        if (map) {
          const c = map.getCenter();
          const z = map.getZoom();
          const next = { ...layerStates, [layerId]: !layerStates[layerId as keyof typeof layerStates] } as any;
          setStateInUrl({ lat: c.lat, lng: c.lng, z, svc: selectedMapService, layers: next }, true);
        }
      } catch {}
    }
  }, []);

  const saveWorkspace = useCallback(async () => {
    const drawings = mapRef.current?.getDrawingGeoJSON?.() || null;
    const mapInstance = mapRef.current?.getMap?.();
    const center = mapInstance ? mapInstance.getCenter() : { lat: 36.6837, lng: -80.2876 };
    const zoom = mapInstance ? mapInstance.getZoom() : 10;
    const payload = {
      name: workspaceName,
      createdAt: new Date().toISOString(),
      map: {
        center: [center.lat, center.lng] as [number, number],
        zoom,
        mapService: selectedMapService,
        layerStates
      },
      drawings
    };
    await WorkspaceService.save(payload);
    toast.success('Workspace saved');
  }, [workspaceName, selectedMapService, layerStates]);

  const loadWorkspace = useCallback(async () => {
    const ws = await WorkspaceService.load(workspaceName);
    if (!ws) {
      toast.error('Workspace not found');
      return;
    }
    setSelectedMapService(ws.map.mapService);
    setLayerStates(ws.map.layerStates as any);
    if (mapRef.current?.getMap?.()) {
      mapRef.current.getMap()?.setView(ws.map.center as any, ws.map.zoom);
    }
    if (ws.drawings) {
      mapRef.current?.loadDrawingGeoJSON?.(ws.drawings);
    }
    toast.success('Workspace loaded');
  }, [workspaceName]);

  // Idle preload of heavy components to reduce interaction latency
  useEffect(() => {
    const preload = () => {
      FreeMapContainer.preload();
      MeasurementToolbar.preload();
      PropertyPanel.preload();
      AsphaltDetector.preload();
      EnhancedAsphaltDetector.preload();
      OverlayManager.preload();
      ServiceInfo.preload();
    };

    if ('requestIdleCallback' in window) {
      (window as Window & { requestIdleCallback?: (cb: IdleRequestCallback, opts?: { timeout?: number }) => number })
        .requestIdleCallback?.(preload, { timeout: 2000 });
    } else {
      const id = window.setTimeout(preload, 1500);
      return () => window.clearTimeout(id);
    }
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-gis-satellite safe-area-inset-top safe-area-inset-left safe-area-inset-right">
      {/* Enhanced Header */}
      <div className="toolbar-enhanced z-50 flex-shrink-0">
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          {/* Top row - Enhanced with better visual hierarchy */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-success hover:shadow-glow transition-all duration-300 hover:scale-105">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold text-foreground truncate">
                    Patrick County GIS Pro
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    High-resolution mapping & measurement tools
                  </p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Status Indicators */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="hidden xs:inline text-xs font-medium text-green-600">Live</span>
                <span className="hidden sm:inline text-xs font-medium text-green-600">Data</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <Signal className="w-3 h-3 text-blue-600" />
                <span className="hidden sm:inline text-xs font-medium text-blue-600">Connected</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
                <Zap className="w-3 h-3 text-purple-600" />
                <span className="hidden sm:inline text-xs font-medium text-purple-600">AI Ready</span>
              </div>
            </div>
          </div>

          {/* Bottom row - Enhanced Search and Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 lg:gap-6">
            <div className="flex-1 max-w-full sm:max-w-md">
              <AddressSearchBar onLocationSelect={handleLocationSearch} onGetDirections={handleGetDirections} />
            </div>
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <MapServiceDropdown
                selectedService={selectedMapService}
                onServiceChange={setSelectedMapService}
                className="min-w-[140px] sm:min-w-[160px] lg:min-w-[200px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (gpsLocation && mapRef.current?.centerOnGpsLocation) {
                    mapRef.current.centerOnGpsLocation();
                  } else {
                    requestLocation();
                  }
                }}
                disabled={!gpsSupported || gpsLoading}
                className="btn-secondary-enhanced flex items-center gap-2 text-xs hover:shadow-panel"
                title={gpsSupported ? "Find my location" : "Location not supported"}
              >
                <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {gpsLoading ? 'Locating...' : 'Locate Me'}
                </span>
              </Button>
              <div className="hidden md:flex items-center gap-2">
                <input
                  className="px-2 py-1 rounded border text-xs bg-background"
                  placeholder="Workspace name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
                <Button variant="secondary" size="sm" onClick={saveWorkspace} className="text-xs">Save</Button>
                <Button variant="secondary" size="sm" onClick={loadWorkspace} className="text-xs">Load</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={async () => {
                  try {
                    const map = mapRef.current?.getMap?.();
                    if (!map) return;
                    const c = map.getCenter();
                    const z = map.getZoom();
                    const title = prompt('Bookmark title?') || `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)} @ ${z}`;
                    const { setStateInUrl } = await import('@/lib/urlState');
                    setStateInUrl({ lat: c.lat, lng: c.lng, z, svc: selectedMapService, layers: layerStates }, true);
                    const { BookmarksService } = await import('@/services/BookmarksService');
                    await BookmarksService.add(title, { lat: c.lat, lng: c.lng, z, svc: selectedMapService, layers: layerStates });
                    toast.success('Bookmarked');
                  } catch (e) {
                    toast.error('Failed to add bookmark');
                  }
                }} title="Bookmark"><Bookmark className="w-3.5 h-3.5" /></Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={async () => {
                  try {
                    const map = mapRef.current?.getMap?.();
                    if (!map) return;
                    const center = map.getCenter();
                    const state = {
                      name: workspaceName,
                      createdAt: new Date().toISOString(),
                      map: {
                        center: [center.lat, center.lng] as [number, number],
                        zoom: map.getZoom(),
                        mapService: selectedMapService,
                        layerStates
                      },
                      drawings: mapRef.current?.getDrawingGeoJSON?.() || null
                    };
                    const { WorkspaceVersionsService } = await import('@/services/WorkspaceVersionsService');
                    await WorkspaceVersionsService.createVersion(workspaceName, state as any);
                    toast.success('Version saved');
                  } catch {
                    toast.error('Failed to save version');
                  }
                }} title="Save Version"><Save className="w-3.5 h-3.5" /></Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={async () => {
                  try {
                    const { WorkspaceVersionsService } = await import('@/services/WorkspaceVersionsService');
                    const latest = await WorkspaceVersionsService.getLatestVersion(workspaceName);
                    if (!latest) { toast.info('No versions yet'); return; }
                    const ws = latest.payload as any;
                    setSelectedMapService(ws.map.mapService);
                    setLayerStates(ws.map.layerStates);
                    const map = mapRef.current?.getMap?.();
                    map?.setView(ws.map.center as any, ws.map.zoom);
                    mapRef.current?.loadDrawingGeoJSON?.(ws.drawings);
                    toast.success(`Restored version ${latest.version}`);
                  } catch {
                    toast.error('Failed to restore version');
                  }
                }} title="Restore Latest"><History className="w-3.5 h-3.5" /></Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={async () => {
                  try {
                    const map = mapRef.current?.getMap?.();
                    if (!map) return;
                    const b = map.getBounds();
                    const aoi = { bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] };
                    const params = { surfaces: ['asphalt'], detail: 'standard' };
                    const { AiJobsService } = await import('@/services/AiJobsService');
                    const id = await AiJobsService.queue(aoi, params);
                    toast.success('AI job queued', { description: id });
                  } catch {
                    toast.error('Failed to queue AI job');
                  }
                }} title="Queue AI Batch"><Play className="w-3.5 h-3.5" /></Button>
              </div>
              <div className="hidden xl:flex items-center gap-2 text-xs text-muted-foreground max-w-xs">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Patrick County, VA</span>
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>Carroll, Floyd, Franklin, Henry</span>
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>Stokes & Surry Counties, NC</span>
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" />
                  <span>VA–NC line (Rt 8 / Salem Hwy)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <Suspense fallback={
          <div className="h-full w-full flex items-center justify-center bg-muted/20">
            <div className="flex flex-col items-center gap-4">
              <div className="spinner-enhanced"></div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Loading Patrick County GIS Pro...</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wifi className="w-3 h-3" />
                  <span>Connecting to mapping services</span>
                </div>
              </div>
            </div>
          </div>
        }>
          {/* Map Component */}
          <FreeMapContainer
            ref={mapRef}
            activeTool={activeTool}
            onMeasurement={handleMeasurement}
            onPropertySelect={(property) => {
              setSelectedProperty(property);
              setPropertyPanelOpen(true);
            }}
            mapService={selectedMapService}
            layerStates={layerStates}
            onLayerToggle={handleLayerToggle}
            gpsLocation={gpsLocation}
          />

          {/* Directions meta overlay */}
          {directionsMeta && (
            <div className="absolute bottom-4 left-4 z-40 bg-gis-panel/90 backdrop-blur-sm p-2 sm:p-3 rounded-lg shadow-panel flex items-center gap-2">
              <span className="text-xs text-foreground">
                {directionsMeta.distanceText} · {directionsMeta.durationText}
              </span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { mapRef.current?.clearRoute?.(); setDirectionsMeta(null); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}

          {showAsphaltDetector && (
            <EnhancedAsphaltDetector 
              map={mapRef.current?.getMap?.() || null}
              onDetectionComplete={(results) => {
                console.log('Enhanced asphalt detection results:', results);
                toast.success(`Enhanced AI analysis complete: ${results.length} surfaces detected`, {
                  description: "Advanced computer vision analysis with measurements and cost estimates"
                });
              }}
              onClose={() => setShowAsphaltDetector(false)}
            />
          )}

          {/* Enhanced Measurement Tools */}
          <MeasurementToolbar
            activeTool={activeTool}
            onToolChange={(tool) => {
              if (tool === 'print') {
                setShowPrintComposer(true);
              } else {
                setActiveTool(tool);
              }
            }}
            currentMeasurement={currentMeasurement}
            layerStates={layerStates}
            onLayerToggle={handleLayerToggle}
            onAsphaltDetection={() => setShowAsphaltDetector(!showAsphaltDetector)}
            showAsphaltDetector={showAsphaltDetector}
          />
          {showPrintComposer && (
            <PrintComposer mapRef={mapRef} onClose={() => setShowPrintComposer(false)} />
          )}
          
          {/* Enhanced Property Information Panel */}
          <PropertyPanel
            isOpen={propertyPanelOpen}
            onToggle={() => setPropertyPanelOpen(!propertyPanelOpen)}
            propertyInfo={{
              parcelId: "Sample-123",
              owner: "John Doe",
              address: "123 Main St, Stuart, VA",
              acreage: 2.5,
              taxValue: 150000,
              zoning: "Residential"
            }}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default Index;
