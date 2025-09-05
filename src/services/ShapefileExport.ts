export async function exportAsShapefile(featureCollection: GeoJSON.FeatureCollection, filename = 'measurements'):
  Promise<{ ok: boolean; message?: string }>
{
  try {
    // Try shp-write if available
    const mod = await import('shp-write').catch(() => null as any);
    if (mod && (mod as any).download) {
      (mod as any).download(featureCollection, { file: filename });
      return { ok: true };
    }
    if (mod && (mod as any).zip) {
      const zip = (mod as any).zip(featureCollection);
      const blob = new Blob([zip], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      return { ok: true };
    }
    return { ok: false, message: 'shp-write not available' };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Failed to export shapefile' };
  }
}

