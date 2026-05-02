import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import YAML from 'yaml'
import chalk from 'chalk'
import { httpLogger } from './logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * HTTP服务配置类
 * 用于读取和设置HTTP服务配置项
 * @class
 * @param {string} name - HTTP服务名称
 * @param {Object} options - HTTP服务配置项
 */
class ConfigHttp {
    constructor(
        name = 'undefined-service',
        options = {}
    ) {
        this.configPath = path.join(__dirname, `../config/config/services/${name}.yml`);
        this.name = name;
        this.options = {
            name,
            ...options
        };
        this.init()
    }

    init() {
        try {
            if (this.name === 'undefined-service') {
                return
            }

            if (!fs.existsSync(path.dirname(this.configPath))) {
                fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
            }

            if (!fs.existsSync(this.configPath)) {
                fs.writeFileSync(this.configPath, YAML.stringify(this.options));
            }

        } catch (error) {
            httpLogger.error(chalk.red('初始化HTTP服务配置文件失败: ' + error));
        }
    }

    /**
     * 读取所有配置项
     * @returns {Object} 所有配置项的键值对对象
     */
    async readAllConfig() {
        try {
            if (this.name === 'undefined-service') {
                return {};
            }
            const cfg = await YAML.parse(fs.readFileSync(this.configPath, 'utf-8'));
            return cfg || {};
        } catch (error) {
            httpLogger.error(chalk.red('读取HTTP服务配置文件失败: ' + error));
            return {};
        }
    }

    /**
     * 设置配置项
     * @param {string} key - 配置项键
     * @param {*} value - 配置项值
     */
    async setConfig(key, value) {
        try {
            if (this.name === 'undefined-service') {
                return;
            }
            if (!key) {
                throw new Error('配置项 键 不能为空');
            }
            if (!value) {
                throw new Error('配置项 值 不能为空');
            }

            const cfg = await this.readAllConfig();

            cfg[key] = value;

            await fs.promises.writeFile(this.configPath, YAML.stringify(cfg));
        } catch (error) {
            httpLogger.error(chalk.red('HTTP服务设置配置项失败: ' + error));
        }
    }

    async getConfig(key) {
        if (this.name === 'undefined-service') {
            return null;
        }
        const cfg = await this.readAllConfig();
        return cfg[key] || null;
    }
}

export {
    ConfigHttp
}
