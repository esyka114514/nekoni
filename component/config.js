import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { logger } from '#utils';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultConfigPath = path.join(__dirname, '../config/default_config/config.yml');
const configPath = path.join(__dirname, '../config/config/config.yml');

if (!fs.existsSync(defaultConfigPath)) {
    logger.error(chalk.red('未找到默认配置文件，请尝试重新拉取项目'));
    process.exit(1);
}

if (!fs.existsSync(path.dirname(configPath))) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
}

if (!fs.existsSync(configPath)) {
    fs.copyFileSync(defaultConfigPath, configPath);
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
