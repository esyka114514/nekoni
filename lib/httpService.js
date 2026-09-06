import fs from 'fs';
import { dirname, join, basename } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { Config } from '../component/index.js';
import express from 'express'
import { httpLogger } from '../utils/logger.js';
import createError from 'http-errors';
import cors from 'cors';
import log4js from 'log4js';
import webuiRouter from './webui.js'

const app = express()

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTTP_SERVICES_DIR = join(__dirname, '..', 'httpServices');

/**
 * http服务类管理类
 * 用于加载、启动HTTP服务
 * !!! 存在于http服务黑名单列表的服务不会被加载，也不可以手动启动
 * @class
 */

class HttpServiceManager {
    constructor() {
        this.services = new Map();
        this.blacklist = Config.httpServiceBlacklist || [];
        this.isRunning = false;
    }

    async loadHttpServices() {
        if (!fs.existsSync(HTTP_SERVICES_DIR)) {
            return httpLogger.warn(`HTTP服务目录不存在: ${HTTP_SERVICES_DIR}`);
        }

        const files = fs.readdirSync(HTTP_SERVICES_DIR).filter(f => f.endsWith('.js'));

        for (const file of files) {
            try {
                const filePath = join(HTTP_SERVICES_DIR, file);
                const module = await import(`file://${filePath}`);
                const ServiceName = basename(filePath, '.js');

                if (this.blacklist.includes(ServiceName)) {
                    httpLogger.warn(chalk.yellow(`HTTP服务 [${ServiceName}] 在黑名单中，跳过`));
                    continue;
                }

                const Service = module.default;

                if (!Service || !(Service instanceof express.Router)) {
                    httpLogger.warn(`${file} 没有导出有效的HTTP服务，跳过`);
                    continue;
                }        

                this.services.set(ServiceName, Service);
                httpLogger.info(chalk.cyan(`加载HTTP服务 [${ServiceName}]`));
            } catch (error) {
                httpLogger.error(chalk.red(`加载HTTP服务 ${file} 失败: ${error}`));
            }
        }

        httpLogger.info(
            chalk.cyan(`共加载`),
            chalk.green(`${this.services.size}`),
            chalk.cyan(`个HTTP服务`));
    }

    start() {
        if (this.isRunning) {
            httpLogger.warn('HTTP服务已在运行中');
            return;
        }

        const port = Config.httpPort || 3000;
        
        // 全局中间件
        app.use(cors());
        app.use(log4js.connectLogger(httpLogger, { level: 'auto', format: ':method :url :status :res[content-length] - :response-time ms' }));
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        // 注册服务路由
        for (const [name, service] of this.services) {
            app.use(`/service/${name}`, service)
        }

        app.use(webuiRouter)

        // 404 处理
        app.use((req, res, next) => {
            next(createError(404));
        });

        // 错误处理
        app.use((err, req, res, next) => {
            res.status(err.status || 500).json({
                code: err.status || 500,
                message: err.message
            });
        });

        const server = app.listen(port, () => {
            this.isRunning = true;
            httpLogger.info(chalk.cyan(`HTTP服务正在监听端口: ${port}`));
            httpLogger.info(chalk.cyan(`地址: http://localhost:${port}`));
        });

        server.on('error', (err) => {
            httpLogger.error(chalk.red(`HTTP服务启动失败: ${err.message}`));
        });
    }

    getService(name) {
        return this.services.get(name);
    }

    getAllServices() {
        return Array.from(this.services.values());
    }
}

const httpServiceManager = new HttpServiceManager();

export { httpServiceManager }
