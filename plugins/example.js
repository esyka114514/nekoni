import { Plugin } from '#lib';
import { Config } from '../utils/index.js';

const pluginName = 'example-plugin';

// 必须传入插件名称，否则会取消执行
const config = new Config(pluginName, {
    aaa: 114514
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
        await config.setConfig('bbb', process.uptime());
        const cfg = await config.readAllConfig();
        pluginLogger.info(`所有配置值: ${JSON.stringify(cfg)}`);
        //更多用法请参考 /utils/config.js
    }
}

export default ExamplePlugin;
