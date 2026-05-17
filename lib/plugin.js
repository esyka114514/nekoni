import fs from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import schedule from 'node-schedule';
import chalk from 'chalk';
import { Config } from '../component/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PLUGINS_DIR = join(__dirname, '..', 'plugins');

/**
 * 插件管理类
 * 用于加载、启动、停止插件
 * !!! 存在于插件黑名单列表的插件不会被加载，也不可以手动启动
 * @class
 */

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.scheduledJobs = new Map();
        this.blacklist = Config.pluginBlacklist || [];
    }

    /**
     * 加载 plugins 目录下的所有插件
     */
    async loadPlugins() {
        if (!fs.existsSync(PLUGINS_DIR)) {
            return pluginLogger.warn(`插件目录不存在: ${PLUGINS_DIR}`);
        }

        const files = fs.readdirSync(PLUGINS_DIR).filter(f => f.endsWith('.js'));

        for (const file of files) {
            try {
                const filePath = join(PLUGINS_DIR, file);
                const module = await import(`file://${filePath}`);
                
                const TaskClass = module.default;
                if (!TaskClass || typeof TaskClass !== 'function') {
                    pluginLogger.warn(`${file} 没有导出有效的类，跳过`);
                    continue;
                }

                const instance = new TaskClass();
                
                if (!instance.name || !instance.cron || typeof instance.execute !== 'function') {
                    pluginLogger.warn(`${file} 缺少必要属性(name/cron)或方法(execute)，跳过`);
                    continue;
                }

                if (this.blacklist.includes(instance.name)) {
                    pluginLogger.warn(chalk.yellow(`插件 [${instance.name}] 在黑名单中，跳过`));
                    continue;
                }

                this.plugins.set(instance.name, instance);
                pluginLogger.info(chalk.blue(`加载插件 [${instance.name}]`), chalk.white(`Cron [${instance.cron}]`));
            } catch (error) {
                pluginLogger.error(chalk.red(`加载插件 ${file} 失败: ${error}`));
            }
        }

        pluginLogger.info(
            chalk.blue(`共加载`),
            chalk.green(`${this.plugins.size}`),
            chalk.blue(`个插件`));
    }

    /**
     * 手动启动指定插件
     * @param {string} name - 插件名称
     */
    startPlugin(name) {
        if (this.scheduledJobs.has(name)) {
            pluginLogger.warn(`插件 [${name}] 已在运行中`);
            return;
        }
        const plugin = this.getPlugin(name);
        if (plugin) {
            this.scheduleJob(name, plugin);
        } else {
            pluginLogger.warn(`插件 [${name}] 不存在`);
        }
    }

    /**
     * 启动所有已加载的插件（黑名单除外）
     */
    startAll() {
        for (const [name, plugin] of this.plugins) {
            this.scheduleJob(name, plugin);
        }
    }

    /**
     * 调度单个插件的定时任务
     * @param {string} name - 插件名称
     * @param {Object} plugin - 插件实例
     */
    scheduleJob(name, plugin) {
        const job = schedule.scheduleJob(plugin.cron, async () => {
            pluginLogger.mark(chalk.blue(`[${name}] 执行定时任务`));
            try {
                await plugin.execute();
                pluginLogger.mark(chalk.green(`[${name}] 定时任务完成`));
            } catch (error) {
                pluginLogger.error(chalk.red(`[${name}] 定时任务执行失败: ${error}`));
            }
        });

        this.scheduledJobs.set(name, job);
        pluginLogger.info(chalk.blue(`[${name}] 已调度任务`));
    }

    /**
     * 停止所有已调度的插件任务
     */
    stopAll() {
        for (const [name, job] of this.scheduledJobs) {
            job.cancel();
            pluginLogger.info(chalk.blue(`[${name}] 已取消任务`));
        }
        this.scheduledJobs.clear();
    }

    /**
     * 停止指定插件的定时任务
     * @param {string} name - 插件名称
     */
    stopPlugin(name) {
        const job = this.scheduledJobs.get(name);
        if (job) {
            job.cancel();
            this.scheduledJobs.delete(name);
            pluginLogger.info(chalk.blue(`[${name}] 已取消任务`));
        } else {
            pluginLogger.warn(`插件 [${name}] 未运行`);
        }
    }

    /**
     * 获取指定名称的插件实例
     * @param {string} name - 插件名称
     * @returns {Object|undefined} 插件实例，不存在则返回 undefined
     */
    getPlugin(name) {
        return this.plugins.get(name);
    }

    /**
     * 获取所有已加载的插件实例
     * @returns {Array} 插件实例数组
     */
    getAllPlugins() {
        return Array.from(this.plugins.values());
    }
}

class Plugin {
    /**
     * 插件基类
     * @param {Object} pluginInfo - 插件信息对象，包含 name 和 cron 属性
     */
    constructor(pluginInfo) {
        if (new.target === Plugin) {
            throw new TypeError('不能直接实例化 Plugin 类');
        }
        
        this.name = pluginInfo.name || 'unnamed-plugin';
        this.cron = pluginInfo.cron || '* * * * *';
    }

    /**
     * 执行方法
     */
    async execute() {
        throw new Error('子类必须实现 execute 方法');
    }
}

const pluginManager = new PluginManager();

export {
    pluginManager,
    Plugin,
}
