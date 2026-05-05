import { logger } from './utils/logger.js'
import fs from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import YAML from 'yaml'

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultConfigPath = join(__dirname, './config/default_config/config.yml');
const configPath = join(__dirname, './config/config/config.yml');

logger.info('开始初始化Nekoni...')

if (!fs.existsSync(defaultConfigPath)) {
    logger.error(`默认配置文件不存在，请尝试重新拉取仓库: ${defaultConfigPath}`);
    process.exit(1);
}

if (!fs.existsSync(configPath)) {
    try {
        fs.mkdirSync(dirname(configPath), { recursive: true });
        fs.copyFileSync(defaultConfigPath, configPath);
        logger.info('已创建默认配置文件');
    } catch (error) {
        logger.error(`创建配置文件失败: ${error.message}`);
    }
}

logger.info('正在检测配置项是否完整...')

/**
 * 递归查找缺失的配置项
 * @param {Object} defaultObj - 默认配置对象
 * @param {Object} currentObj - 当前配置对象
 * @param {string} prefix - 当前路径前缀
 * @returns {string[]} 缺失的配置项路径列表
 */
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

try {
    const defaultConfig = YAML.parse(fs.readFileSync(defaultConfigPath, 'utf-8'));
    const currentConfig = YAML.parse(fs.readFileSync(configPath, 'utf-8')) || {};

    const missingKeys = findMissingKeys(defaultConfig, currentConfig);

    if (missingKeys.length > 0) {
        logger.warn('发现以下配置项缺失：');
        missingKeys.forEach(key => logger.warn(`  - ${key}`));
        logger.info('正在自动修补缺失的配置项...');

        /**
         * 递归补充缺失的配置项
         * @param {Object} defaultObj - 默认配置对象
         * @param {Object} currentObj - 当前配置对象
         * @returns {Object} 合并后的配置对象
         */
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

        const mergedConfig = mergeMissingKeys(defaultConfig, currentConfig);
        fs.writeFileSync(configPath, YAML.stringify(mergedConfig));
        logger.info('已自动修补缺失的配置项');
    } else {
        logger.info('配置项完整，无需修补');
    }
} catch (error) {
    logger.error(`检测配置项失败: ${error.message}`);
}

logger.info('Nekoni初始化完成，用时', process.uptime().toFixed(2), '秒')