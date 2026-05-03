import { Router } from 'express'
import { ConfigHttp } from '../utils/index.js'

const config = new ConfigHttp('example', {
    title: 'Example Service',
    version: '1.0.0',
})

const router = Router()

router.get('/', async (req, res) => {
    const cfg = await config.readAllConfig()
    res.json({
        message: 'Hello, World!',
        config: cfg
    })
})

router.get('/config/:key', async (req, res) => {
    const value = await config.getConfig(req.params.key)
    res.json({ key: req.params.key, value })
})

router.post('/config', async (req, res) => {
    const { key, value } = req.body
    await config.setConfig(key, value)
    res.json({ success: true, key, value })
})

router.get('/send', async (req, res) => {
    const result = await sendMessage({
        title: 'Test message',
        message: '这是一封测试测试',
    })
    res.status(result ? 200 : 500).json({
        message: 'Hello, World!',
        success: result
    })
})

export default router