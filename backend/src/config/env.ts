import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const srcDirectory = path.resolve(currentDirectory, '..');
const backendRoot = path.resolve(srcDirectory, '..');
const dataDirectory = path.join(backendRoot, 'data');

export const env = {
  mode: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.API_PORT ?? 3001),
  paths: {
    backendRoot,
    data: dataDirectory,
    raw: path.join(dataDirectory, 'raw'),
    processed: path.join(dataDirectory, 'processed'),
    spreadsheets: path.join(dataDirectory, 'raw', 'spreadsheets'),
    povertyReports: path.join(dataDirectory, 'raw', 'poverty_reports'),
    worldBank: path.join(dataDirectory, 'raw', 'world_bank'),
  },
} as const;
