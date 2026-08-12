import test from 'node:test'; import assert from 'node:assert/strict'; import { inspectGeoJSON } from '../src/geojson.js';
test('extracts GeoJSON metadata', () => { const m = inspectGeoJSON(Buffer.from(JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [77, 28] }, properties: {} }] }))); assert.equal(m.featureCount, 1); assert.deepEqual(m.boundingBox, [77, 28, 77, 28]); });
test('rejects invalid GeoJSON', () => assert.throws(() => inspectGeoJSON(Buffer.from('{}')), /supported/));
