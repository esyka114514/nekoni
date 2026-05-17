import fs from 'fs';
import YAML from 'yaml';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { logger } from '#utils';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultConfigPath = join(__dirname, '../config/default_config/config.yml');
const configPath = join(__dirname, '../config/config/config.yml');

if (!fs.existsSync(defaultConfigPath)) {
    logger.error(chalk.red('未找到默认配置文件，请尝试重新拉取项目'));
    process.exit(1);
}

if (!fs.existsSync(dirname(configPath))) {
    fs.mkdirSync(dirname(configPath), { recursive: true });
}

if (!fs.existsSync(configPath)) {
    fs.copyFileSync(defaultConfigPath, configPath);
    logger.info(chalk.green('已创建默认配置文件'));
}

function findMissingKeys(defaultObj, currentObj, prefix = '') {
    const missing = [];

    for (const key of Object.keys(defaultObj)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;

        if (!(key in currentObj)) {
            missing.push(fullPath);
            continue;
        }

        if (typeof defaultObj[key] === 'object' && defaultObj[key] !== null && !Array.isArray(defaultObj[key])) {
            const nestedMissing = findMissingKeys(defaultObj[key], currentObj[key], fullPath);
            missing.push(...nestedMissing);
        }
    }

    return missing;
}

function mergeMissingKeys(defaultObj, currentObj) {
    const result = { ...currentObj };

    for (const key of Object.keys(defaultObj)) {
        if (!(key in result)) {
            result[key] = defaultObj[key];
        } else if (typeof defaultObj[key] === 'object' && defaultObj[key] !== null && !Array.isArray(defaultObj[key])) {
            result[key] = mergeMissingKeys(defaultObj[key], result[key]);
        }
    }

    return result;
}

try {
    const defaultConfig = YAML.parse(fs.readFileSync(defaultConfigPath, 'utf-8'));
    const currentConfig = YAML.parse(fs.readFileSync(configPath, 'utf-8')) || {};

    const missingKeys = findMissingKeys(defaultConfig, currentConfig);

    if (missingKeys.length > 0) {
        logger.warn(chalk.yellow('发现以下配置项缺失：'));
        missingKeys.forEach(key => logger.warn(`  - ${key}`));
        logger.info(chalk.green('正在自动修补缺失的配置项...'));

        const mergedConfig = mergeMissingKeys(defaultConfig, currentConfig);
        fs.writeFileSync(configPath, YAML.stringify(mergedConfig));
        logger.info(chalk.green('已自动修补缺失的配置项'));
    }
} catch (error) {
    logger.error(chalk.red('检测配置项失败: ') + error.message);
}

/**
 * 配置管理器（热重载）
 */
class ConfigManager {
    constructor() {
        this.config = {};
        this.watcher = null;
        this.reload();
        this.watch();

        return new Proxy(this, {
            get: (target, prop) => {
                if (prop in target) return target[prop];
                return target.config[prop];
            }
        });
    }

    reload() {
        try {
            const raw = fs.readFileSync(configPath, 'utf-8');
            this.config = YAML.parse(raw) || {};
        } catch (error) {
            logger.error(chalk.red('读取主配置文件失败: ') + error.message);
        }
    }

    watch() {
        this.watcher = chokidar.watch(configPath, { ignoreInitial: true });
        this.watcher.on('change', () => {
            this.reload();
            logger.mark(chalk.green('[主配置文件已重载]'));
        });
    }

    get(key) {
        if (!key) return this.config;
        return key.split('.').reduce((obj, k) => obj?.[k], this.config);
    }

    getAll() {
        return this.config;
    }
}

const cfg = new ConfigManager();

export default cfg;
