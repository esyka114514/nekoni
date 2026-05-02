import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import YAML from 'yaml'
import chalk from 'chalk'
import { logger } from '#utils'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * 插件配置类
 * 用于读取和设置插件配置项
 * @class
 * @param {string} name - 插件名称
 * @param {Object} options - 插件配置项
 */
class Config {
    constructor(
        name = 'undefined-plugin',
        options = {}
    ) {
        this.configPath = path.join(__dirname, `../config/config/plugins/${name}.yml`);
        this.name = name;
        this.options = {
            name,
            ...options
        };
        this.init()
    }

    init() {
        try {
            if (this.name === 'undefined-plugin') {
                return
            }

            if (!fs.existsSync(path.dirname(this.configPath))) {
                fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
            }

            if (!fs.existsSync(this.configPath)) {
                fs.writeFileSync(this.configPath, YAML.stringify(this.options));
            }

        } catch (error) {
            logger.error(chalk.red('初始化插件配置文件失败: ' + error.message));
        }
    }

    /**
     * 读取所有配置项
     * @returns {Object} 所有配置项的键值对对象
     */
    async readAllConfig() {
        try {
            if (this.name === 'undefined-plugin') {
                return {};
            }
            const cfg = await YAML.parse(fs.readFileSync(this.configPath, 'utf-8'));
            return cfg || {};
        } catch (error) {
            logger.error(chalk.red('读取插件配置文件失败: ' + error.message));
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
            if (this.name === 'undefined-plugin') {
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
            logger.error(chalk.red('插件设置配置项失败: ' + error.message));
        }
    }

    async getConfig(key) {
        if (this.name === 'undefined-plugin') {
            return null;
        }
        const cfg = await this.readAllConfig();
        return cfg[key] || null;
    }
}

export {
    Config
}
