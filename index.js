import { logger, pluginLogger, httpLogger } from '#utils';
import { pluginManager, httpServiceManager } from '#lib';
import chalk from 'chalk';
import { Data } from './component/index.js';
import Config from './component/config.js';

global.pluginLogger = pluginLogger;
global.httpLogger = httpLogger;

process.title = `${Data.name} v${Data.version} ©2026 ${Data.author}`;
process.env.TZ = "Asia/Shanghai"

async function main() {
    const startTime = Date.now();
    logger.info(chalk.bgBlue(`正在启动：${Data.name} v${Data.version}`));
    logger.info(chalk.blue('⣿⣿⣿⠟⠛⠛⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⢋⣩⣉⢻'))
    logger.info(chalk.blue('⣿⣿⣿⠀⣿⣶⣕⣈⠹⠿⠿⠿⠿⠟⠛⣛⢋⣰⠣⣿⣿⠀⣿'))
    logger.info(chalk.blue('⣿⣿⣿⡀⣿⣿⣿⣧⢻⣿⣶⣷⣿⣿⣿⣿⣿⣿⠿⠶⡝⠀⣿'))
    logger.info(chalk.blue('⣿⣿⣿⣷⠘⣿⣿⣿⢏⣿⣿⣋⣀⣈⣻⣿⣿⣷⣤⣤⣿⡐⢿'))
    logger.info(chalk.blue('⣿⣿⣿⣿⣆⢩⣝⣫⣾⣿⣿⣿⣿⡟⠿⠿⠦⠀⠸⠿⣻⣿⡄⢻'))
    logger.info(chalk.blue('⣿⣿⣿⣿⣿⡄⢻⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣾⣿⣿⣿⣿⠇⣼'))
    logger.info(chalk.blue('⣿⣿⣿⣿⣿⣿⡄⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⣰'))
    logger.info(chalk.blue('⣿⣿⣿⣿⣿⣿⠇⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢀⣿'))
    logger.info(chalk.blue('⣿⣿⣿⣿⣿⠏⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢸⣿'))
    logger.info(chalk.blue('⣿⣿⣿⣿⠟⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⣿'))
    logger.info(chalk.blue('⣿⣿⣿⠋⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⣿'))
    logger.info(chalk.blue('⣿⣿⠋⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⢸'))
    logger.info(chalk.blue('-----------------------------'))
    await pluginManager.loadPlugins();
    pluginManager.startAll();

    await httpServiceManager.loadHttpServices();
    httpServiceManager.start();

    if (pluginManager.getAllPlugins().length === 0 && httpServiceManager.getAllServices().length === 0) {
        logger.info(chalk.bgYellow(`未加载任何插件或服务，进程将退出...`));
    } else {
        logger.info(chalk.bgGreen(`Nekoni已启动，耗时：`),
            chalk.yellow(`${((Date.now() - startTime) / 1000).toFixed(2)}`),
            chalk.bgGreen('秒')
        );
    }
}

main().catch(error => {
    logger.error('服务启动失败:', error);
    process.exit(1);
});

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => {
        logger.info(chalk.bgRed(`收到 ${signal} 信号，正在关闭${Data.name} v${Data.version}...`));
        pluginManager.stopAll();
        if (Config.watcher) {
            Config.watcher.close();
        }
        logger.info(
            chalk.bgGreen(`本次运行时长：`),
            chalk.yellow(`${process.uptime().toFixed(2)}`),
            chalk.bgGreen('秒')
        );
        logger.info(chalk.bgBlue(`${Data.name} v${Data.version} 已停止`));
        process.exit(0);
    });
}
