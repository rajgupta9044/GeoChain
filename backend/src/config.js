import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

export const config = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret-change-me',
  mongoUri: process.env.MONGODB_URI || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(value => value.trim()).filter(Boolean),
  blockchainRpcUrl: process.env.BLOCKCHAIN_RPC_URL || '',
  contractAddress: process.env.CONTRACT_ADDRESS || '',
  blockchainNetwork: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
  ipfsApiUrl: process.env.IPFS_API_URL || '',
  ipfsApiToken: process.env.IPFS_API_TOKEN || '',
  maxFileSize: Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024,
  storageDir: new URL('../storage/', import.meta.url).pathname.replace(/^\//, '')
};
