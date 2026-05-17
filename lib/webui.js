import { Router } from 'express';
import express from 'express';
import { pluginManager, httpServiceManager } from '#lib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import crypto from 'crypto';
import Config from '../component/config.js';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const WEBUI_DIR = join(__dirname, '..', 'dist');
const PACKAGE_JSON = JSON.parse(fs.readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

const router = Router();

const sessions = new Map();

function authMiddleware(req, res, next) {
    if (!Config.httpAuthKey) {
        return next();
    }

    const token = req.headers['x-auth-token'] || req.query.token;
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: '未授权访问' });
    }

    const session = sessions.get(token);
    if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
        sessions.delete(token);
        return res.status(401).json({ error: '会话已过期' });
    }

    session.timestamp = Date.now();
    next();
}

let previousCpuInfo = {
    idle: 0,
    total: 0,
    timestamp: Date.now()
};

function getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });

    const currentIdle = totalIdle;
    const currentTotal = totalTick;
    const timestamp = Date.now();

    const idleDiff = currentIdle - previousCpuInfo.idle;
    const totalDiff = currentTotal - previousCpuInfo.total;

    previousCpuInfo = {
        idle: currentIdle,
        total: currentTotal,
        timestamp
    };

    if (totalDiff === 0) {
        return 0;
    }

    const cpuUsage = 100 - ((idleDiff / totalDiff) * 100);
    return Math.max(0, Math.min(100, cpuUsage));
}

function getMemoryUsage() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    return {
        total: Math.round(total / (1024 * 1024 * 1024) * 100) / 100,
        used: Math.round(used / (1024 * 1024 * 1024) * 100) / 100,
        free: Math.round(free / (1024 * 1024 * 1024) * 100) / 100,
        usagePercent: Math.round((used / total) * 100 * 100) / 100
    };
}

async function getDiskUsage() {
    const disks = [];

    if (process.platform === 'win32') {
        try {
            const { stdout } = await execAsync(
                'powershell -Command "Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID,VolumeName,Size,FreeSpace | ConvertTo-Json"'
            );
            const diskData = JSON.parse(stdout);
            const diskArray = Array.isArray(diskData) ? diskData : [diskData];
            
            for (const disk of diskArray) {
                if (disk.Size && disk.Size > 0) {
                    const freeSpace = disk.FreeSpace || 0;
                    const size = disk.Size;
                    const used = size - freeSpace;
                    const usagePercent = Math.round((used / size) * 100 * 100) / 100;
                    
                    disks.push({
                        mount: disk.DeviceID,
                        label: disk.VolumeName || '本地磁盘',
                        total: Math.round(size / (1024 * 1024 * 1024) * 100) / 100,
                        used: Math.round(used / (1024 * 1024 * 1024) * 100) / 100,
                        free: Math.round(freeSpace / (1024 * 1024 * 1024) * 100) / 100,
                        usagePercent
                    });
                }
            }
        } catch (e) {
            console.error('Failed to get disk usage:', e);
        }
    } else {
        try {
            const { stdout } = await execAsync('df -h');
            const lines = stdout.split('\n').slice(1);
            
            for (const line of lines) {
                if (!line.trim()) continue;
                const parts = line.split(/\s+/);
                if (parts.length >= 5 && parts[0].startsWith('/dev/')) {
                    disks.push({
                        mount: parts[5] || parts[4],
                        total: parts[1],
                        used: parts[2],
                        free: parts[3],
                        usagePercent: parseFloat(parts[4]) || 0
                    });
                }
            }
        } catch (e) {
            console.error('Failed to get disk usage:', e);
        }
    }

    return disks;
}

async function getTopProcesses() {
    const processes = [];

    if (process.platform === 'win32') {
        try {
            const { stdout } = await execAsync(
                'powershell -NoProfile -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 10 @{n=\'Name\';e={$_.ProcessName}},@{n=\'Id\';e={$_.Id}},@{n=\'CPU\';e={[math]::Round($_.CPU,2)}},@{n=\'WorkingSet64\';e={$_.WorkingSet64}} | ConvertTo-Json -Compress"'
            );
            const processData = JSON.parse(stdout);
            const processArray = Array.isArray(processData) ? processData : [processData];
            
            for (const proc of processArray) {
                processes.push({
                    name: proc.Name || 'Unknown',
                    pid: proc.Id,
                    cpu: proc.CPU || 0,
                    memory: Math.round((proc.WorkingSet64 || 0) / (1024 * 1024) * 100) / 100
                });
            }
        } catch (e) {
            console.error('Failed to get top processes:', e);
        }
    } else {
        try {
            const { stdout } = await execAsync(
                'ps aux --sort=-%mem | head -11 | tail -10'
            );
            const lines = stdout.trim().split('\n');
            
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 11) {
                    const name = parts[10].split('/').pop();
                    const rssKB = parseInt(parts[5]) || 0;
                    processes.push({
                        name: name || 'Unknown',
                        pid: parseInt(parts[1]),
                        cpu: parseFloat(parts[2]) || 0,
                        memory: Math.round(rssKB / 1024 * 100) / 100
                    });
                }
            }
        } catch (e) {
            console.error('Failed to get top processes:', e);
        }
    }

    return processes;
}

router.post('/api/login', (req, res) => {
    const { key } = req.body;
    if (!Config.httpAuthKey) {
        return res.json({ token: 'no-auth-required' });
    }
    if (key === Config.httpAuthKey) {
        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, { timestamp: Date.now() });
        return res.json({ token });
    }
    res.status(401).json({ error: '认证密钥错误' });
});

router.use((req, res, next) => {
    if (req.path.startsWith('/api/') && req.path !== '/api/login') {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        authMiddleware(req, res, next);
    } else {
        next();
    }
});

router.get('/api/jobs', (req, res) => {
    const plugins = pluginManager.getAllPlugins();
    const jobs = plugins.map(plugin => ({
        name: plugin.name,
        cron: plugin.cron,
        running: pluginManager.scheduledJobs.has(plugin.name)
    }));

    res.json({
        jobs,
        total: jobs.length
    });
});

router.get('/api/http-services', (req, res) => {
    const services = [];
    for (const [name, service] of httpServiceManager.services) {
        services.push({
            name,
            running: httpServiceManager.isRunning
        });
    }

    res.json({
        services,
        total: services.length,
        httpServerRunning: httpServiceManager.isRunning
    });
});

router.get('/api/project-info', (req, res) => {
    res.json({
        name: PACKAGE_JSON.name,
        version: PACKAGE_JSON.version,
        github: PACKAGE_JSON.repository.url
    });
});

router.get('/api/system-stats', async (req, res) => {
    const cpuUsage = getCpuUsage();
    const memory = getMemoryUsage();
    const disks = await getDiskUsage();
    const topProcesses = await getTopProcesses();

    res.json({
        cpu: {
            usage: Math.round(cpuUsage * 100) / 100,
            cores: os.cpus().length,
            model: os.cpus()[0]?.model || 'Unknown'
        },
        memory,
        disks,
        topProcesses,
        uptime: process.uptime(),
        timestamp: Date.now()
    });
});

if (fs.existsSync(WEBUI_DIR)) {
    router.use(express.static(WEBUI_DIR));
    
    router.get('/api/*path', (req, res) => {
        res.status(404).json({ error: 'API 端点不存在' });
    });
    
    router.get('/*path', (req, res) => {
        res.sendFile(join(WEBUI_DIR, 'index.html'));
    });
}

export default router;
