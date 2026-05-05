import { dirname, join } from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { logger } from '#utils';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageInfoPath = join(__dirname, '../package.json')

async function getData() {
    try {
        const packageInfo = await JSON.parse(fs.readFileSync(packageInfoPath, 'utf8'))
        return packageInfo || {
            name: 'unknown',
            version: '0.0.0',
        };
    } catch (error) {
        logger.error(`读取 package.json 失败:`, error);
        return {
            name: 'unknown',
            version: '0.0.0',
        };
    }
}

const data = await getData();

export default data;
