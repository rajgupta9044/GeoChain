export function inspectGeoJSON(buffer) {
  let geo; try { geo = JSON.parse(buffer.toString('utf8')); } catch { throw new Error('The uploaded file is not valid JSON'); }
  if (!geo || !['FeatureCollection', 'Feature'].includes(geo.type)) throw new Error('Only GeoJSON FeatureCollection or Feature files are supported');
  const features = geo.type === 'Feature' ? [geo] : geo.features;
  if (!Array.isArray(features)) throw new Error('GeoJSON FeatureCollection must contain a features array');
  const coords = []; const types = new Set();
  const walk = (c) => Array.isArray(c) && (typeof c[0] === 'number' ? coords.push(c) : c.forEach(walk));
  features.forEach(f => { if (!f.geometry?.type || !f.geometry.coordinates) throw new Error('Every feature must have geometry'); types.add(f.geometry.type); walk(f.geometry.coordinates); });
  if (!coords.length) throw new Error('GeoJSON contains no coordinate data');
  const xs = coords.map(c => c[0]); const ys = coords.map(c => c[1]);
  return { featureCount: features.length, geometryTypes: [...types], crs: geo.crs?.properties?.name || 'WGS 84 (assumed EPSG:4326)', boundingBox: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
}
