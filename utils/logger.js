import log4js from 'log4js';

log4js.configure({
    appenders: {
        console: {
            type: 'console'
        },
        file: { 
            type: 'file', 
            filename: 'logs/app.log',
            maxLogSize: 10485760, 
            maxBackups: 3, 
            compress: true 
        }
    },
    categories: {
        default: {
            appenders: ['console', 'file'],
            level: 'info'
        },
        plugin: {
            appenders: ['console', 'file'],
            level: 'info'
        }
    }
});

const logger = log4js.getLogger();
const pluginLogger = log4js.getLogger('plugin');

export {
    logger,
    pluginLogger
};
