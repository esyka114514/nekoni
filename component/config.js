import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { logger } from '#utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultConfigPath = path.join(__dirname, '../config/default_config/config.yml');
const configPath = path.join(__dirname, '../config/config/config.yml');

if (!fs.existsSync(defaultConfigPath)) {
    logger.error(chalk.red('未找到默认配置文件，请尝试重新拉取项目'));
    process.exit(1);
}

if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath),  { recursive: true });
}

/**
 * 初始化插件配置文件
 */
if (!fs.existsSync(configPath)) {
    fs.copyFileSync(defaultConfigPath, configPath);
}

/**
 * 读取配置文件
 * @returns {Object} 配置项的键值对对象
 */
async function getConfig() {
    try {
        const cfg = await YAML.parse(fs.readFileSync(configPath, 'utf-8'));
        return cfg || {};
    } catch (error) {
        logger.error(chalk.red('读取插件配置文件失败: ' + error));
        return {};
    }
}

const config = await getConfig();

export default config;
