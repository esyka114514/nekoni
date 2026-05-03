import { logger } from './utils/logger.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, 'package.json');
const packageJsonBakPath = path.join(__dirname, 'package.json.bak');

logger.info('开始更新Nekoni...')

/**
 * 检查命令是否可用
 * @param {string} command - 命令名称
 * @returns {boolean} 是否可用
 */
function checkCommand(command) {
    try {
        execSync(`${command} --version`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * 递归合并配置项
 * 以 newObj 为准，oldObj 中独有的键会补充进去
 * @param {Object} newObj - 新配置对象（优先级更高）
 * @param {Object} oldObj - 旧配置对象（补充缺失的键）
 * @returns {Object} 合并后的配置对象
 */
function mergeConfig(newObj, oldObj) {
    const result = { ...newObj };

    for (const key of Object.keys(oldObj)) {
        if (!(key in result)) {
            result[key] = oldObj[key];
        } else if (typeof oldObj[key] === 'object' && oldObj[key] !== null && !Array.isArray(oldObj[key])) {
            result[key] = mergeConfig(result[key], oldObj[key]);
        }
    }

    return result;
}

// 1. 检查工具是否安装
logger.info('正在检测依赖工具...')

if (!checkCommand('git')) {
    logger.error('未检测到 git，请先安装 git');
    process.exit(1);
}
logger.info('git 已安装')

if (!checkCommand('pnpm')) {
    logger.warn('未检测到 pnpm，请先安装 pnpm');
    process.exit(1);
}
logger.info('pnpm 已安装')

// 2. 备份 package.json
logger.info('正在备份 package.json...')

try {
    const oldPackageJson = fs.readFileSync(packageJsonPath, 'utf-8');
    fs.writeFileSync(packageJsonBakPath, oldPackageJson);
    logger.info('已备份 package.json 到 package.json.bak');
    fs.unlinkSync(packageJsonPath)
} catch (error) {
    logger.error(`备份 package.json 失败: ${error.message}`);
    process.exit(1);
}

// 3. 使用 git 拉取仓库
logger.info('正在拉取最新代码...')

try {
    execSync('git pull', { stdio: 'inherit' });
    logger.info('代码拉取完成');
} catch (error) {
    logger.error(`代码拉取失败: ${error.message}`);
    const oldPackageJson = JSON.parse(fs.readFileSync(packageJsonBakPath, 'utf-8'));
    fs.writeFileSync(packageJsonPath, JSON.stringify(oldPackageJson, null, 2) + '\n');
    logger.info('已回滚 package.json 到备份版本');
    process.exit(1);
}

// 4. 使用原 package.json 递归修补新的 package.json
logger.info('正在合并 package.json...')

try {
    const oldPackageJson = JSON.parse(fs.readFileSync(packageJsonBakPath, 'utf-8'));
    const newPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    const mergedPackageJson = mergeConfig(newPackageJson, oldPackageJson);
    fs.writeFileSync(packageJsonPath, JSON.stringify(mergedPackageJson, null, 2) + '\n');
    logger.info('已自动合并 package.json');
} catch (error) {
    logger.error(`合并 package.json 失败: ${error.message}`);
    const oldPackageJson = JSON.parse(fs.readFileSync(packageJsonBakPath, 'utf-8'));
    fs.writeFileSync(packageJsonPath, JSON.stringify(oldPackageJson, null, 2) + '\n');
    logger.info('已回滚 package.json 到备份版本');
    process.exit(1);
}

// 5. 安装依赖
logger.info('正在安装依赖...')

try {
    execSync('pnpm install', { stdio: 'inherit' });
    logger.info('依赖安装完成');
} catch (error) {
    logger.error(`依赖安装失败: ${error.message}`);
    process.exit(1);
}

// 6. 清理备份文件
try {
    fs.unlinkSync(packageJsonBakPath);
    logger.info('已清理备份文件');
} catch (error) {
    logger.warn(`清理备份文件失败: ${error.message}`);
}

logger.info(`Nekoni更新完成，用时 ${process.uptime().toFixed(2)} 秒`)
