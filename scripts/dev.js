import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('[Dev] Starting Activity Tracker backend & frontend...');

const serverProc = spawn('node', ['server/src/server.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const clientProc = spawn('npm', ['--prefix', 'client', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

const cleanup = () => {
  serverProc.kill();
  clientProc.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
