import fs from 'node:fs';
import path from 'node:path';

export const ENV_PATH = path.resolve(process.cwd(), '.env');
export const EXAMPLE_ENV_PATH = path.resolve(process.cwd(), '.env.example');

export function ensureEnvFile() {
  if (fs.existsSync(ENV_PATH)) return ENV_PATH;
  if (fs.existsSync(EXAMPLE_ENV_PATH)) {
    fs.copyFileSync(EXAMPLE_ENV_PATH, ENV_PATH);
  } else {
    fs.writeFileSync(ENV_PATH, '', 'utf8');
  }
  return ENV_PATH;
}

export function parseEnvFile(file = ENV_PATH) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    env[match[1]] = unquoteEnvValue(match[2]);
  }
  return env;
}

export function loadEnvFile() {
  ensureEnvFile();
  const env = parseEnvFile();
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return env;
}

export function setEnvValues(values, file = ENV_PATH) {
  ensureEnvFile();
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const indexes = new Map();
  lines.forEach((line, index) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match) indexes.set(match[1], index);
  });

  for (const [key, value] of Object.entries(values)) {
    const nextLine = `${key}=${quoteEnvValue(value)}`;
    if (indexes.has(key)) {
      lines[indexes.get(key)] = nextLine;
    } else {
      if (lines.length && lines[lines.length - 1] !== '') lines.push('');
      lines.push(nextLine);
    }
    process.env[key] = String(value ?? '');
  }

  fs.writeFileSync(file, `${lines.join('\n').replace(/\n+$/u, '')}\n`, 'utf8');
}

export function maskSecret(value) {
  const text = String(value || '');
  if (!text) return '';
  if (text.length <= 8) return '********';
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function quoteEnvValue(value) {
  const text = String(value ?? '');
  if (!text) return '';
  if (/^[A-Za-z0-9_./:@+=,-]+$/u.test(text)) return text;
  return JSON.stringify(text);
}

function unquoteEnvValue(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

