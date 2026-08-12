import { config } from './config.js';

export async function pinGeoJSON(buffer, fileName) {
  if (!config.ipfsApiUrl) return null;
  const form = new FormData(); form.append('file', new Blob([buffer], { type: 'application/geo+json' }), fileName);
  const headers = config.ipfsApiToken ? { Authorization: `Bearer ${config.ipfsApiToken}` } : {};
  const response = await fetch(config.ipfsApiUrl, { method: 'POST', headers, body: form });
  if (!response.ok) throw new Error(`IPFS upload failed with status ${response.status}`);
  const data = await response.json(); return data.Hash || data.cid || data.CID || data.IpfsHash || null;
}
