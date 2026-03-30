import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const srcDirectory = path.resolve(currentDirectory, '..');
const backendRoot = path.resolve(srcDirectory, '..');
const dataDirectory = path.join(backendRoot, 'data');
const databaseDirectory = process.env.DATABASE_DIR
  ? path.resolve(process.env.DATABASE_DIR)
  : path.join(dataDirectory, 'database');
const sqlitePath = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.join(databaseDirectory, 'poverty-insights.sqlite');

export const env = {
  mode: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? process.env.API_PORT ?? 3001),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  paths: {
    backendRoot,
    data: dataDirectory,
    database: databaseDirectory,
    sqlite: sqlitePath,
    raw: path.join(dataDirectory, 'raw'),
    processed: path.join(dataDirectory, 'processed'),
    spreadsheets: path.join(dataDirectory, 'raw', 'spreadsheets'),
    geospatial: path.join(dataDirectory, 'raw', 'geospatial'),
    povertyReports: path.join(dataDirectory, 'raw', 'poverty_reports'),
    worldBank: path.join(dataDirectory, 'raw', 'world_bank'),
  },
} as const;
