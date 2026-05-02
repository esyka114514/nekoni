import { Plugin } from '#lib';
import { Config } from '../utils/index.js';

const pluginName = 'example-plugin';

// 必须传入插件名称，否则会取消执行
const config = new Config(pluginName, {
    title: 'Example Plugin',
    version: '1.0.0',
});

class ExamplePlugin extends Plugin {
    constructor() {
        super({
            name: pluginName,
            cron: '* * * * * ?'
        });
    }

    async execute() {
        pluginLogger.info('执行示例插件 Run example plugin');
        
        const cfg = await config.readAllConfig();
        pluginLogger.info(`所有配置值: ${JSON.stringify(cfg)}`);
        
        if (cfg.enabled) {
            await config.setConfig('lastRun', new Date().toISOString());
            await config.setConfig('runCount', (cfg.runCount || 0) + 1);
            pluginLogger.info(`插件已运行 ${(cfg.runCount || 0) + 1} 次`);
        }
        //更多用法请参考/utils/config.js
    }
}

export default ExamplePlugin;
