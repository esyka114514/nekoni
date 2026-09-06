# Nekoni

> 一个基于 Node.js 的自动化执行脚本及启动 HTTP 服务的框架

## 目录

- [安装教程](#安装教程)
- [使用教程](#使用教程)
- [修改配置教程](#修改配置教程)
- [更新教程](#更新教程)
- [插件编写指南](#插件编写指南)
- [HTTP 服务编写指南](#http-服务编写指南)
- [Utils 工具使用指南](#utils-工具使用指南)

***

## 安装教程

### 环境要求

- Node.js >= 16.0.0
- pnpm（推荐）或 npm

### 安装步骤

```bash
git clone https://github.com/esyka114514/nekoni.git
cd nekoni
pnpm install
```

### 首次运行

首次运行会自动创建配置文件：

```bash
pnpm start
```

程序会在 `config/config/` 目录下生成 `config.yml`，基于 `config/default_config/config.yml` 的默认配置。

***

## 使用教程

### 启动项目

```bash
pnpm start
```

### 开发模式（自动重启）

```bash
pnpm dev
```

### WebUI

启动后访问 `http://localhost:8080`（端口可在配置中修改）进入 WebUI 管理界面。

首次访问需要输入 `httpAuthKey`（配置文件中设置）进行认证。

### WebUI 开发

```bash
pnpm webui:dev
```

### WebUI 构建与部署

```bash
pnpm webui:build
cd webui && pnpm deploy
```

***

## 修改配置教程

### 主配置文件

主配置文件位于 `config/config/config.yml`，程序启动时会自动检测并补全缺失的配置项。

```yaml
# HTTP 服务端口
httpPort: 8080

# WebUI 认证密钥
httpAuthKey: your-secret-key

# 插件黑名单（不会加载和执行）
pluginBlacklist:
  - example-plugin

# HTTP 服务黑名单（不会自动启动）
httpServiceBlacklist:
  - example-service

# 通知配置
notification:
  email:
    use: false
    host: smtp.example.com
    port: 465
    secure: true
    user: your@email.com
    password: your-password
    to: recipient@email.com
  
  gotify:
    use: false
    url: https://gotify.example.com
    token: your-gotify-token
```

### 插件配置

每个插件的配置文件位于 `config/config/plugins/<插件名称>.yml`

### HTTP 服务配置

每个 HTTP 服务的配置文件位于 `config/config/services/<服务名称>.yml`，首次加载服务时会自动创建。

### 配置热重载

主配置文件修改后会自动热重载，无需重启程序。

***

## 更新教程

```bash
pnpm update
```

该命令会执行 `update.js` 脚本，自动拉取最新代码并处理配置文件的合并。

***

## 插件编写指南

插件是定时执行的任务，通过 Cron 表达式调度。

### 目录结构

插件文件放在 `plugins/` 目录下，以 `.js` 结尾。

### 编写插件

```javascript
import { Plugin, pluginManager } from '#lib';
import { logger } from '#utils';

class MyPlugin extends Plugin {
    constructor() {
        super({
            name: 'my-plugin',
            cron: '0 */1 * * *' // 每小时执行一次
        });
    }

    async execute() {
        logger.info('执行我的插件任务');
        // 你的业务逻辑
    }
}

export default MyPlugin;
```

### 插件 API

| 属性/方法       | 说明           |
| ----------- | ------------ |
| `name`      | 插件名称（必填）     |
| `cron`      | Cron 表达式（必填） |
| `execute()` | 执行方法（必填）     |

### 读取插件配置

```javascript
import { Config } from '#utils';

const pluginConfig = new Config('my-plugin', {
    key1: 'default-value',
    key2: 123
});

const config = await pluginConfig.readAllConfig();
const value = await pluginConfig.getConfig('key1');
await pluginConfig.setConfig('key1', 'new-value');
```

### 发送通知

```javascript
import { sendMessage } from '#utils';

await sendMessage({
    title: '任务完成',
    message: '插件任务执行成功',
    priority: 5
});
```

### 黑名单

将插件名称加入 `config.yml` 的 `pluginBlacklist` 可禁止其加载和执行。

***

## HTTP 服务编写指南

HTTP 服务是基于 Express Router 的 API 服务。

### 目录结构

服务文件放在 `httpServices/` 目录下，以 `.js` 结尾。

### 编写服务

```javascript
import { Router } from 'express';
import { httpLogger } from '#utils';

const router = Router();

router.get('/hello', (req, res) => {
    res.json({ message: 'Hello World' });
});

router.post('/data', (req, res) => {
    const { name } = req.body;
    httpLogger.info(`收到数据: ${name}`);
    res.json({ success: true });
});

export default router;
```

### 访问服务

服务启动后可通过 `http://localhost:8080/service/<服务名称>` 访问。

例如上述服务可通过以下地址访问：

- `GET http://localhost:8080/service/my-service/hello`
- `POST http://localhost:8080/service/my-service/data`

### 读取服务配置

```javascript
import { ConfigHttp } from '#utils';

const serviceConfig = new ConfigHttp('my-service', {
    apiKey: 'default-key'
});

const config = await serviceConfig.readAllConfig();
const apiKey = await serviceConfig.getConfig('apiKey');
```

### 黑名单

将服务名称加入 `config.yml` 的 `httpServiceBlacklist` 可禁止其加载和启动。

***

## Utils 工具使用指南

### 导入方式

```javascript
import { logger, pluginLogger, httpLogger, Config, ConfigHttp, sendMessage, sendEmail, sendGotify } from '#utils';
```

### Logger

提供三个日志记录器：

```javascript
import { logger, pluginLogger, httpLogger } from '#utils';

logger.info('普通日志');
pluginLogger.info('插件日志');
httpLogger.info('HTTP 服务日志');
```

日志会同时输出到控制台和 `logs/app.log` 文件。

### Config（插件配置类）

用于管理插件的配置文件。

```javascript
import { Config } from '#utils';

const config = new Config('plugin-name', {
    key: 'default-value'
});

const allConfig = await config.readAllConfig();
const value = await config.getConfig('key');
await config.setConfig('key', 'new-value');
```

### ConfigHttp（HTTP 服务配置类）

用于管理 HTTP 服务的配置文件。

```javascript
import { ConfigHttp } from '#utils';

const config = new ConfigHttp('service-name', {
    apiKey: 'default-key'
});

const allConfig = await config.readAllConfig();
const value = await config.getConfig('apiKey');
await config.setConfig('apiKey', 'new-key');
```

### 通知系统

支持邮件和 Gotify 两种通知方式。

```javascript
import { sendMessage, sendEmail, sendGotify } from '#utils';

await sendMessage({
    title: '通知标题',
    message: '通知内容',
    priority: 5
});

await sendEmail({
    title: '邮件标题',
    message: '邮件内容'
});

await sendGotify({
    title: 'Gotify 标题',
    message: 'Gotify 内容',
    priority: 5
});
```

### Data（项目信息）

```javascript
import { Data } from '#lib';

console.log(Data.name);    // 项目名称
console.log(Data.version); // 项目版本
```

### Config（主配置）

```javascript
import { Config } from '#lib';

console.log(Config.httpPort);
console.log(Config.httpAuthKey);
console.log(Config.notification.email.use);
```

主配置支持热重载，修改 `config.yml` 后自动更新。
