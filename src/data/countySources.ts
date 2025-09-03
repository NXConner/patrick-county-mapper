export type CountyId = 'patrick-va' | 'henry-va' | 'stokes-nc' | 'surry-nc';

export type ParcelEndpoint =
  | { type: 'arcgis'; url: string; attribution?: string }
  | { type: 'wms'; url: string; layers: string; attribution?: string };

export interface CountySource {
  id: CountyId;
  name: string;
  state: 'VA' | 'NC';
  portalUrl?: string;
  parcelEndpoint?: ParcelEndpoint;
}

export const COUNTY_SOURCES: CountySource[] = [
  {
    id: 'henry-va',
    name: 'Henry County',
    state: 'VA',
    portalUrl: 'https://www.henrycountyva.gov/284/GIS-Maps'
  },
  {
    id: 'stokes-nc',
    name: 'Stokes County',
    state: 'NC',
    portalUrl: 'https://www.stokescountync.gov' // Update to official GIS portal if available
  },
  {
    id: 'surry-nc',
    name: 'Surry County',
    state: 'NC',
    portalUrl: 'https://cvportal.co.surry.nc.us/CityViewPortal/Property/Locate'
  }
];

