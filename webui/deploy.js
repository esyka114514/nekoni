import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, 'dist');
const TARGET_DIR = join(__dirname, '..', 'dist');

if (!fs.existsSync(DIST_DIR)) {
    console.error('错误: dist 目录不存在，请先执行 build');
    process.exit(1);
}

if (fs.existsSync(TARGET_DIR)) {
    fs.rmSync(TARGET_DIR, { recursive: true, force: true });
}

fs.cpSync(DIST_DIR, TARGET_DIR, { recursive: true });
console.log('部署完成: /webui/dist -> /dist');
