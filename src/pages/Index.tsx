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
import { useWorkspaceRole } from '@/hooks/useWorkspaceRole';

// Lazy load heavy components
const FreeMapContainer = lazyWithPreload(() => import('@/components/Map/FreeMapContainer'));
const MeasurementToolbar = lazyWithPreload(() => import('@/components/Toolbar/MeasurementToolbar'));
const PropertyPanel = lazyWithPreload(() => import('@/components/PropertyInfo/PropertyPanel'));
const AsphaltDetector = lazyWithPreload(() => import('@/components/Map/AsphaltDetector'));
const EnhancedAsphaltDetector = lazyWithPreload(() => import('@/components/Map/EnhancedAsphaltDetector'));
const OverlayManager = lazyWithPreload(() => import('@/components/Map/OverlayManager'));
const PrintComposer = lazyWithPreload(() => import('@/components/Map/PrintComposer'));
const VersionHistoryDialog = lazyWithPreload(() => import('@/components/Workspace/VersionHistoryDialog'));
const BookmarksDialog = lazyWithPreload(() => import('@/components/Workspace/BookmarksDialog'));
const EstimatorPanel = lazyWithPreload(() => import('@/components/Estimator/EstimatorPanel'));
const AiJobsDialog = lazyWithPreload(() => import('@/components/AI/AiJobsDialog'));
const ShareDialog = lazyWithPreload(() => import('@/components/Workspace/ShareDialog'));
const ExportHistoryDialog = lazyWithPreload(() => import('@/components/Export/ExportHistoryDialog'));
const TilePrefetchDialog = lazyWithPreload(() => import('@/components/Offline/TilePrefetchDialog'));
const BatchAoiTool = lazyWithPreload(() => import('@/components/Map/BatchAoiTool'));
const ImportDataDialog = lazyWithPreload(() => import('@/components/Import/ImportDataDialog'));
const OverlayLegend = lazyWithPreload(() => import('@/components/Map/OverlayLegend'));

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
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showEstimator, setShowEstimator] = useState(false);
  const [lastAreaSqFt, setLastAreaSqFt] = useState<number | null>(null);
  const [lastSurfaces, setLastSurfaces] = useState<Array<{ type: string; area: number }> | undefined>(undefined);
  const [showAiJobs, setShowAiJobs] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showExportHistory, setShowExportHistory] = useState(false);
  const [showPrefetch, setShowPrefetch] = useState(false);
  const [showBatchAoi, setShowBatchAoi] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { isViewer } = useWorkspaceRole(workspaceName);

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
    if (typeof measurement.area === 'number') setLastAreaSqFt(measurement.area);
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
              <Button variant="outline" size="sm" className="text-xs" onClick={() => { window.location.href = '/analytics'; }}>Analytics</Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => { window.location.href = '/billing'; }}>Billing</Button>
              <div className="hidden md:flex items-center gap-2">
                <input
                  className="px-2 py-1 rounded border text-xs bg-background"
                  placeholder="Workspace name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
                <Button variant="secondary" size="sm" onClick={saveWorkspace} className="text-xs" disabled={isViewer}>Save</Button>
                <Button variant="secondary" size="sm" onClick={loadWorkspace} className="text-xs">Load</Button>
                <Button variant="outline" size="sm" className="text-xs" disabled={isViewer} onClick={async () => {
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
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowBookmarks(true)} title="Bookmarks">Bookmarks</Button>
                <Button variant="outline" size="sm" className="text-xs" disabled={isViewer} onClick={async () => {
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
                <Button variant="outline" size="sm" className="text-xs" disabled={isViewer} onClick={async () => {
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
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowAiJobs(true)} title="AI Jobs">AI Jobs</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowVersionHistory(true)} title="Version History">History</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowShare(true)} title="Share">Share</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={async () => {
                  try {
                    const map = mapRef.current?.getMap?.();
                    if (!map) return;
                    const c = map.getCenter();
                    const z = map.getZoom();
                    const { setStateInUrl } = await import('@/lib/urlState');
                    setStateInUrl({ lat: c.lat, lng: c.lng, z, svc: selectedMapService, layers: layerStates }, true);
                    await navigator.clipboard.writeText(window.location.href);
                    toast.success('Share link copied');
                  } catch {
                    toast.error('Failed to copy link');
                  }
                }} title="Copy Share Link">Copy Link</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowEstimator(true)} title="Estimator">Estimate</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowExportHistory(true)} title="Export History">Exports</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowPrefetch(true)} title="Offline Prefetch">Prefetch</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowBatchAoi(true)} title="Batch AOI">Batch AOI</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowImport(true)} title="Import Data">Import</Button>
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
            readOnly={isViewer}
            snappingEnabled={false}
          />
          {/* Overlay Legend */}
          <OverlayLegend zoning={(layerStates as any).zoning} flood={(layerStates as any).flood} soils={(layerStates as any).soils} />

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
                try {
                  const surfaces = (results || []).map((r: any) => ({ type: r.surfaceType, area: r.area }));
                  setLastSurfaces(surfaces);
                  const totalArea = surfaces.reduce((sum, s) => sum + (typeof s.area === 'number' ? s.area : 0), 0);
                  if (totalArea > 0) setLastAreaSqFt(totalArea);
                } catch {}
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
            readOnly={isViewer}
            snappingEnabled={false}
            onSnappingChange={() => {}}
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
            onOpenParcel={async (parcelId) => {
              const { PropertyService } = await import('@/services/PropertyService');
              const rec = await PropertyService.getByParcel(parcelId);
              if (rec) {
                setSelectedProperty({
                  parcelId: rec.parcel_id,
                  owner: rec.owner_name || undefined,
                  address: rec.property_address || undefined,
                  acreage: rec.acreage || undefined,
                  taxValue: rec.tax_value || undefined,
                  zoning: rec.zoning || undefined,
                });
                if (rec.latitude && rec.longitude) {
                  mapRef.current?.getMap?.()?.setView([rec.latitude as any, rec.longitude as any] as any, 18);
                }
                setPropertyPanelOpen(true);
              }
            }}
          />
        </Suspense>
      </div>
      {/* Dialogs */}
      <Suspense>
        {showVersionHistory && (
          <VersionHistoryDialog
            isOpen={showVersionHistory}
            onClose={() => setShowVersionHistory(false)}
            workspaceName={workspaceName}
            onRestore={(v) => {
              const ws = v.payload as any;
              setSelectedMapService(ws.map.mapService);
              setLayerStates(ws.map.layerStates);
              const map = mapRef.current?.getMap?.();
              map?.setView(ws.map.center as any, ws.map.zoom);
              mapRef.current?.loadDrawingGeoJSON?.(ws.drawings);
              setShowVersionHistory(false);
              toast.success(`Restored version ${v.version}`);
            }}
          />
        )}
        {showBookmarks && (
          <BookmarksDialog
            isOpen={showBookmarks}
            onClose={() => setShowBookmarks(false)}
            onNavigate={(lat, lng, z) => {
              const map = mapRef.current?.getMap?.();
              map?.setView([lat, lng] as any, z);
            }}
          />
        )}
        {showEstimator && (
          <EstimatorPanel isOpen={showEstimator} onClose={() => setShowEstimator(false)} areaSqFt={lastAreaSqFt} surfaces={lastSurfaces} />
        )}
        {showAiJobs && (
          <AiJobsDialog isOpen={showAiJobs} onClose={() => setShowAiJobs(false)} />
        )}
        {showShare && (
          <ShareDialog isOpen={showShare} onClose={() => setShowShare(false)} workspaceName={workspaceName} />
        )}
        {showExportHistory && (
          <ExportHistoryDialog isOpen={showExportHistory} onClose={() => setShowExportHistory(false)} />
        )}
        {showPrefetch && (
          <TilePrefetchDialog isOpen={showPrefetch} onClose={() => setShowPrefetch(false)} getViewport={() => {
            const m = mapRef.current?.getMap?.();
            if (!m) return null;
            const b = m.getBounds();
            return { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth(), zoom: m.getZoom() };
          }} />
        )}
        {showBatchAoi && (
          <BatchAoiTool isOpen={showBatchAoi} onClose={() => setShowBatchAoi(false)} getViewport={() => {
            const m = mapRef.current?.getMap?.();
            if (!m) return null;
            const b = m.getBounds();
            return { west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth() };
          }} />
        )}
        {showImport && (
          <ImportDataDialog isOpen={showImport} onClose={() => setShowImport(false)} onGeoJson={(fc) => {
            mapRef.current?.loadDrawingGeoJSON?.(fc);
            toast.success('Imported GeoJSON');
          }} />
        )}
      </Suspense>
    </div>
  );
};

export default Index;
