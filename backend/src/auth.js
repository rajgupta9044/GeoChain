import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import mongoose from 'mongoose';
import { User } from './store.js';

const users = new Map();
const userFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../storage/users.json');
function persist() { fs.mkdirSync(path.dirname(userFile), { recursive: true }); fs.writeFileSync(userFile, JSON.stringify([...users.values()], null, 2)); }
function load() { try { for (const user of JSON.parse(fs.readFileSync(userFile, 'utf8'))) users.set(user.email, user); } catch {} }
load();
const mongoReady = () => mongoose.connection.readyState === 1;
export async function seedAdmin() { if (mongoReady()) { const existing = await User.findOne({ email: 'admin@geochain.local' }); if (!existing) await User.create({ id: 'admin-1', name: 'Platform Admin', email: 'admin@geochain.local', password: bcrypt.hashSync('Admin@123', 12), role: 'ADMIN', approved: true }); return; } if (!users.has('admin@geochain.local')) { users.set('admin@geochain.local', { id: 'admin-1', name: 'Platform Admin', email: 'admin@geochain.local', password: bcrypt.hashSync('Admin@123', 10), role: 'ADMIN', approved: true }); persist(); } }
export async function registerUser({ name, email, password, passwordConfirmation, role = 'USER' }) { if (!name || !email || !password || password.length < 8) throw new Error('Name, email and a password of 8+ characters are required'); if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) throw new Error('Password must include uppercase, lowercase, and a number'); if (passwordConfirmation !== undefined && password !== passwordConfirmation) throw new Error('Passwords do not match'); const key = email.trim().toLowerCase(); const exists = mongoReady() ? await User.findOne({ email: key }) : users.get(key); if (exists) throw new Error('An account with this email already exists'); const user = { id: crypto.randomUUID(), name: name.trim(), email: key, password: bcrypt.hashSync(password, 12), role: role === 'PROVIDER' ? 'PROVIDER' : 'USER', approved: role !== 'PROVIDER' }; if (mongoReady()) await User.create(user); else { users.set(key, user); persist(); } return publicUser(user); }
export async function loginUser(email, password) { const key = email.trim().toLowerCase(); const user = mongoReady() ? await User.findOne({ email: key }).lean() : users.get(key); if (!user) throw new Error('No account was found with this email'); if (!bcrypt.compareSync(password, user.password)) throw new Error('Incorrect password'); if (user.role === 'PROVIDER' && !user.approved) throw new Error('Your provider account is awaiting admin approval'); return { token: jwt.sign({ sub: user.id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: '1h' }), user: publicUser(user) }; }
export async function authRequired(req, res, next) { try { const h = req.headers.authorization || ''; if (!h.startsWith('Bearer ')) throw new Error(); const tokenUser = jwt.verify(h.slice(7), config.jwtSecret); const storedUser = await getUser(tokenUser.sub); if (!storedUser) return res.status(401).json({ error: 'Account no longer exists' }); req.user = { ...tokenUser, role: storedUser.role }; next(); } catch { res.status(401).json({ error: 'Authentication required' }); } }
export function requireRole(...roles) { return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'You do not have permission for this action' }); }
export function publicUser(u) { const { password, ...safe } = u; return safe; }
export async function approveProviders() { const list = mongoReady() ? await User.find({ role: 'PROVIDER', approved: false }).lean() : [...users.values()].filter(u => u.role === 'PROVIDER' && !u.approved); return list.map(publicUser); }
export async function approveUser(id) { const u = mongoReady() ? await User.findOneAndUpdate({ id }, { approved: true }, { new: true }).lean() : [...users.values()].find(x => x.id === id); if (!u) throw new Error('User not found'); if (!mongoReady()) { u.approved = true; persist(); } return publicUser(u); }
export async function getUser(id) { const u = mongoReady() ? await User.findOne({ id }).lean() : [...users.values()].find(x => x.id === id); return u ? publicUser(u) : null; }
export async function deleteUser(id) { if (mongoReady()) return Boolean((await User.deleteOne({ id })).deletedCount); const u = [...users.values()].find(x => x.id === id); if (!u) return false; users.delete(u.email); persist(); return true; }
