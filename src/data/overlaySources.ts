export type OverlayEndpoint = { type: 'wms'; url: string; layers: string; attribution?: string };

export interface OverlaySourcesConfig {
  zoning?: OverlayEndpoint;
  flood?: OverlayEndpoint;
  soils?: OverlayEndpoint;
}

// Configure overlay endpoints here. Leave empty to skip.
export const OVERLAY_SOURCES: OverlaySourcesConfig = {
  // FEMA NFHL (verify coverage for your area)
  flood: { type: 'wms', url: 'https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/WMSServer', layers: '0' },
  // NRCS Soils (WGS84 Geographic)
  soils: { type: 'wms', url: 'https://sdmdataaccess.nrcs.usda.gov/Spatial/SDMWGS84Geographic.wms', layers: 'MapunitPoly' },
  // Add a local zoning WMS when available
  // zoning: { type: 'wms', url: 'https://your-zoning-server.example.com/ows', layers: 'zoning' }
};

