import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config } from '../component/index.js';
import { logger } from './logger.js';
import { Data } from '../component/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const emailTemplatePath = path.join(__dirname, '../component/template/email.html');

const emailConfig = Config.notification?.email || {};
const gotifyConfig = Config.notification?.gotify || {};

let emailTransporter = null;

if (emailConfig.host && emailConfig.user && emailConfig.password) {
    emailTransporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port || 465,
        secure: emailConfig.secure || true,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.password
        }
    });
}

/**
 * 渲染邮件 HTML 模板
 * @param {Object} options - 模板变量
 * @returns {string} 渲染后的 HTML
 */
function renderEmailTemplate({ title, body }) {
    let template = '';
    try {
        template = fs.readFileSync(emailTemplatePath, 'utf-8');
    } catch (error) {
        logger.error(`无法读取邮件模板，使用默认段落: ${error.message}`);
        return `<p>${body}</p>`;
    }

    return template
        .replace(/{{title}}/g, title || '')
        .replace(/{{body}}/g, body || '')
        .replace(/{{appName}}/g, Data.name || 'undefined')
        .replace(/{{version}}/g, Data.version || '1.0.0');
}

/**
 * 发送邮件通知
 * @param {Object} options - 邮件选项
 * @param {string} options.title - 邮件标题
 * @param {string} options.message - 邮件内容
 * @param {string} [options.to] - 收件人，默认使用配置中的 to
 */
async function sendEmail({ title, message, to }) {
    if (!emailTransporter) {
        logger.warn('邮件未配置，跳过发送');
        return false;
    }

    const html = renderEmailTemplate({
        title,
        body: message.replace(/\n/g, '<br>'),
    });

    try {
        await emailTransporter.sendMail({
            from: emailConfig.from || emailConfig.user,
            to: to || emailConfig.to,
            subject: title,
            html
        });
        logger.info(`邮件通知已发送: ${title}`);
        return true;
    } catch (error) {
        logger.error(`邮件通知发送失败: ${error.message}`);
        return false;
    }
}

/**
 * 发送 Gotify 通知
 * @param {Object} options - Gotify 选项
 * @param {string} options.title - 通知标题
 * @param {string} options.message - 通知内容
 * @param {number} [options.priority=5] - 优先级 (0-10)
 */
async function sendGotify({ title, message, priority = 5 }) {
    if (!gotifyConfig.url || !gotifyConfig.token) {
        logger.warn('Gotify 未配置，跳过发送');
        return false;
    }

    try {
        const response = await fetch(`${gotifyConfig.url}/message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Gotify-Key': gotifyConfig.token
            },
            body: JSON.stringify({
                title,
                message,
                priority
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        logger.info(`Gotify 通知已发送: ${title}`);
        return true;
    } catch (error) {
        logger.error(`Gotify 通知发送失败: ${error.message}`);
        return false;
    }
}

/**
 * 发送通知
 * @param {Object} options - 通知选项
 * @param {string} options.title - 通知标题
 * @param {string} options.message - 通知内容
 * @param {number} [options.priority=5] - Gotify 优先级 (0-10)
 * @returns {Promise<Object>} 发送结果 { email: boolean, gotify: boolean }
 */
async function sendMessage({
    title,
    message,
    priority = 5,
}) {
    const result = { email: false, gotify: false };

    if (emailConfig.use) {
        result.email = await sendEmail({ title, message });
    } else {
        logger.warn('邮件未启用，跳过发送');
    }

    if (gotifyConfig.use) {
        result.gotify = await sendGotify({ title, message, priority });
    } else {
        logger.warn('Gotify 未启用，跳过发送');
    }

    return result;
}

export { sendMessage, sendEmail, sendGotify };
