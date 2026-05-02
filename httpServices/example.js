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

export default router