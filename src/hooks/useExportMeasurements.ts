import { useCallback } from 'react';
import { toast } from 'sonner';

export interface MeasurementData {
  id: string;
  type: 'distance' | 'area' | 'point';
  value: number;
  unit: string;
  coordinates: [number, number][];
  timestamp: Date;
  notes?: string;
  properties?: Record<string, unknown>;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'geojson' | 'kml';
  includeProperties?: boolean;
  coordinateSystem?: 'wgs84' | 'utm';
}

export const useExportMeasurements = () => {
  const exportToJSON = useCallback((measurements: MeasurementData[], filename: string) => {
    const jsonData = JSON.stringify(measurements, null, 2);
    downloadFile(jsonData, `${filename}.json`, 'application/json');
  }, []);

  const exportToCSV = useCallback((measurements: MeasurementData[], filename: string) => {
    const headers = ['ID', 'Type', 'Value', 'Unit', 'Timestamp', 'Coordinates', 'Notes'];
    const csvRows = [
      headers.join(','),
      ...measurements.map(m => [
        m.id,
        m.type,
        m.value,
        m.unit,
        m.timestamp.toISOString(),
        `"${m.coordinates.map(coord => coord.join(' ')).join('; ')}"`,
        `"${m.notes || ''}"`
      ].join(','))
    ];
    
    const csvData = csvRows.join('\n');
    downloadFile(csvData, `${filename}.csv`, 'text/csv');
  }, []);

  const exportToGeoJSON = useCallback((measurements: MeasurementData[], filename: string) => {
    const features = measurements.map(measurement => ({
      type: 'Feature',
      geometry: {
        type: measurement.type === 'point' ? 'Point' : 
              measurement.type === 'distance' ? 'LineString' : 'Polygon',
        coordinates: measurement.type === 'point' ? measurement.coordinates[0] :
                    measurement.type === 'distance' ? measurement.coordinates :
                    [measurement.coordinates]
      },
      properties: {
        id: measurement.id,
        type: measurement.type,
        value: measurement.value,
        unit: measurement.unit,
        timestamp: measurement.timestamp.toISOString(),
        notes: measurement.notes,
        ...measurement.properties
      }
    }));

    const geoJson = {
      type: 'FeatureCollection',
      features
    };

    const geoJsonData = JSON.stringify(geoJson, null, 2);
    downloadFile(geoJsonData, `${filename}.geojson`, 'application/json');
  }, []);

  const exportToKML = useCallback((measurements: MeasurementData[], filename: string) => {
    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Patrick County GIS Measurements</name>
    <description>Exported measurements from Patrick County GIS Pro</description>`;

    const kmlFooter = `  </Document>
</kml>`;

    const placemarks = measurements.map(measurement => {
      const coordsString = measurement.coordinates
        .map(coord => `${coord[1]},${coord[0]},0`)
        .join(' ');

      const geometryElement = measurement.type === 'point' 
        ? `<Point><coordinates>${coordsString}</coordinates></Point>`
        : measurement.type === 'distance'
        ? `<LineString><coordinates>${coordsString}</coordinates></LineString>`
        : `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coordsString}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;

      return `    <Placemark>
      <name>${measurement.type.toUpperCase()} - ${measurement.value} ${measurement.unit}</name>
      <description><![CDATA[
        Type: ${measurement.type}<br/>
        Value: ${measurement.value} ${measurement.unit}<br/>
        Timestamp: ${measurement.timestamp.toISOString()}<br/>
        ${measurement.notes ? `Notes: ${measurement.notes}<br/>` : ''}
      ]]></description>
      ${geometryElement}
    </Placemark>`;
    }).join('\n');

    const kmlData = kmlHeader + '\n' + placemarks + '\n' + kmlFooter;
    downloadFile(kmlData, `${filename}.kml`, 'application/vnd.google-earth.kml+xml');
  }, []);

  const exportMeasurements = useCallback((
    measurements: MeasurementData[],
    options: ExportOptions,
    filename: string = 'measurements'
  ) => {
    if (measurements.length === 0) {
      toast.error('No measurements to export');
      return;
    }

    try {
      switch (options.format) {
        case 'json':
          exportToJSON(measurements, filename);
          break;
        case 'csv':
          exportToCSV(measurements, filename);
          break;
        case 'geojson':
          exportToGeoJSON(measurements, filename);
          break;
        case 'kml':
          exportToKML(measurements, filename);
          break;
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }

      toast.success(`Measurements exported as ${options.format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export measurements');
    }
  }, [exportToJSON, exportToCSV, exportToGeoJSON, exportToKML]);

  return {
    exportMeasurements,
    exportToJSON,
    exportToCSV,
    exportToGeoJSON,
    exportToKML
  };
};

// Utility function to download files
function downloadFile(data: string, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
}