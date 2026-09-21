import { execSync } from 'child_process';
import { cpSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

console.log('Building frontend...');
execSync('npm run build', { cwd: join(root, 'frontend'), stdio: 'inherit' });

console.log('Building backend...');
execSync('npm run build', { cwd: join(root, 'backend'), stdio: 'inherit' });

const publicDir = join(root, 'backend', 'public');
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

console.log('Copying frontend dist to backend/public...');
cpSync(join(root, 'frontend', 'dist'), publicDir, { recursive: true });

console.log('Build complete!');
