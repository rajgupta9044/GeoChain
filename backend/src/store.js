import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { config } from './config.js';

const localFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '../storage/data.json');
const datasetSchema = new mongoose.Schema({
  datasetId: { type: String, unique: true }, title: String, description: String, providerId: String,
  status: { type: String, index: true }, fileName: String, storagePath: String, ipfsCid: String,
  sha256: String, metadata: Object, versions: Array, createdAt: Date, updatedAt: Date
}, { versionKey: false });
export const Dataset = mongoose.models.Dataset || mongoose.model('Dataset', datasetSchema);
const userSchema = new mongoose.Schema({ id: { type: String, unique: true }, name: String, email: { type: String, unique: true, index: true }, password: String, role: String, approved: Boolean }, { versionKey: false });
export const User = mongoose.models.User || mongoose.model('User', userSchema);

let useMongo = false;
export function storeBackend() { return useMongo ? 'mongodb' : 'local-json'; }
export async function initStore() {
  if (config.mongoUri) {
    try { await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 }); useMongo = true; console.log('MongoDB connected; strict database mode enabled'); return; }
    catch (error) { console.error(`MongoDB connection failed: ${error.message}`); throw new Error('MongoDB is configured but unavailable. Server startup stopped; local JSON fallback is disabled.'); }
  }
  await fs.mkdir(path.dirname(localFile), { recursive: true });
  try { await fs.access(localFile); } catch { await fs.writeFile(localFile, '[]'); }
}
async function readLocal() { return JSON.parse(await fs.readFile(localFile, 'utf8')); }
async function writeLocal(rows) { await fs.writeFile(localFile, JSON.stringify(rows, null, 2)); }
export async function listDatasets({ search = '', status = '', page = 1, limit = 12 } = {}) {
  const skip = (page - 1) * limit;
  if (useMongo) { const query = {}; if (status) query.status = status; if (search) { const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); const pattern = new RegExp(escaped, 'i'); query.$or = [{ title: pattern }, { description: pattern }, { fileName: pattern }]; } const [items, total] = await Promise.all([Dataset.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Dataset.countDocuments(query)]); const providerIds = [...new Set(items.map(d => d.providerId).filter(Boolean))]; const providers = await User.find({ id: { $in: providerIds } }, { id: 1, name: 1 }).lean(); const names = Object.fromEntries(providers.map(p => [p.id, p.name])); return { items: items.map(d => ({ ...d, providerName: names[d.providerId] || 'Unknown provider' })), total, page, limit }; }
  const rows = (await readLocal()).filter(d => (!status || d.status === status) && (!search || `${d.title} ${d.description}`.toLowerCase().includes(search.toLowerCase())));
  return { items: rows.slice(skip, skip + limit), total: rows.length, page, limit };
}
export async function findDataset(datasetId) { if (!useMongo) return (await readLocal()).find(d => d.datasetId === datasetId); const dataset = await Dataset.findOne({ datasetId }).lean(); if (!dataset) return null; const provider = dataset.providerId ? await User.findOne({ id: dataset.providerId }, { name: 1 }).lean() : null; return { ...dataset, providerName: provider?.name || 'Unknown provider' }; }
export async function saveDataset(dataset) { if (useMongo) return Dataset.findOneAndUpdate({ datasetId: dataset.datasetId }, dataset, { upsert: true, new: true }).lean(); const rows = await readLocal(); const i = rows.findIndex(d => d.datasetId === dataset.datasetId); if (i >= 0) rows[i] = dataset; else rows.push(dataset); await writeLocal(rows); return dataset; }
export async function deleteDataset(datasetId) { const dataset = await findDataset(datasetId); if (!dataset) return false; if (useMongo) await Dataset.deleteOne({ datasetId }); else { const rows = await readLocal(); await writeLocal(rows.filter(d => d.datasetId !== datasetId)); } if (dataset.storagePath) { try { await fs.unlink(path.join(config.storageDir, dataset.storagePath)); } catch {} } return true; }
export async function deleteDatasetsByProvider(providerId) { const rows = useMongo ? await Dataset.find({ providerId }).lean() : (await readLocal()).filter(d => d.providerId === providerId); for (const dataset of rows) await deleteDataset(dataset.datasetId); return rows.length; }
export async function reconcileStorage() { if (!useMongo) return; const keep = new Set((await Dataset.find({}, { storagePath: 1 }).lean()).map(d => d.storagePath).filter(Boolean)); await fs.mkdir(config.storageDir, { recursive: true }); for (const file of await fs.readdir(config.storageDir)) { if (file.endsWith('.geojson') && !keep.has(file)) try { await fs.unlink(path.join(config.storageDir, file)); } catch {} } }
export async function datasetStats() { if (useMongo) { const [total, verified, pending, failed] = await Promise.all([Dataset.countDocuments(), Dataset.countDocuments({ status: 'VERIFIED' }), Dataset.countDocuments({ status: 'BLOCKCHAIN_PENDING' }), Dataset.countDocuments({ status: 'FAILED' })]); return { total, verified, pending, failed }; } const rows = await readLocal(); return { total: rows.length, verified: rows.filter(d => d.status === 'VERIFIED').length, pending: rows.filter(d => d.status === 'BLOCKCHAIN_PENDING').length, failed: rows.filter(d => d.status === 'FAILED').length }; }
