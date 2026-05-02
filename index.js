import { logger, pluginLogger } from '#utils';
import { pluginManager } from '#lib';
import chalk from 'chalk';
import { Data } from './component/index.js';

global.pluginLogger = pluginLogger;

process.title = `${Data.name} v${Data.version} ©2026 ${Data.author}`;

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

    if (pluginManager.getAllPlugins().length === 0) {
        logger.info(chalk.bgYellow(`未加载任何插件，进程将退出...`));
    } else {
        logger.info(chalk.bgGreen(`服务已启动，耗时：`),
            chalk.yellow(`${((Date.now() - startTime) / 1000).toFixed(2)}`),
            chalk.bgGreen('秒')
        );
    }
}

main().catch(error => {
    logger.error('服务启动失败:', error);
    process.exit(1);
});

process.on('SIGINT', () => {
    logger.info(chalk.bgRed(`收到SIGINT信号，停止定时任务`));
    pluginManager.stopAll();
    logger.info(
        chalk.bgGreen(`本次运行时长：`),
        chalk.yellow(`${process.uptime().toFixed(2)}`),
        chalk.bgGreen('秒')
    );
    logger.info(chalk.bgBlue(`${Data.name} v${Data.version} 已停止`));
    process.exit(0);
});
