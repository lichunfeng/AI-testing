/**
 * 民族婚礼换装馆 - Node.js 后端服务
 * 
 * 已集成阿里云 AI 换装服务
 * 
 * 使用前请确保：
 * 1. 已开通阿里云人体分割服务 (facebody)
 * 2. 已配置环境变量 ALIYUN_ACCESS_KEY 和 ALIYUN_ACCESS_SECRET
 * 3. 已准备好56个民族的服饰模板图
 */

const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const dotenv = require('dotenv')

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// 引入换装服务（阿里云 或 Replicate）
const { aliyunDress, testConnection, uploadTemplatesToOSS } = require('./services/aliyun-service')
const { replicateDress, testReplicateConnection } = require('./services/replicate-service')

// ============================================================
// 中间件配置
// ============================================================

// 静态文件服务
app.use(express.static('public'))

// JSON解析
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// CORS（开发阶段允许跨域）
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('只支持 jpg/png/webp 格式图片'))
    }
  }
})

// 请求日志
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
  })
  next()
})

// ============================================================
// API 接口
// ============================================================

/**
 * GET /api/health
 * 健康检查
 */
app.get('/api/health', async (req, res) => {
  try {
    const replicateOk = await testReplicateConnection().catch(() => false)
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      replicate: replicateOk ? 'connected' : 'not configured',
      version: '1.0.0'
    })
  } catch (err) {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), replicate: 'error' })
  }
})

/**
 * POST /api/upload
 * 上传图片
 */
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传图片' })
    }
    
    // 返回完整 URL（供小程序使用）
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    
    console.log(`📤 上传成功: ${req.file.filename}`)
    
    res.json({ 
      success: true, 
      url: imageUrl,
      filename: req.file.filename,
      size: req.file.size
    })
  } catch (err) {
    console.error('上传失败:', err)
    res.status(500).json({ success: false, message: err.message })
  }
})


/**
 * POST /api/dress
 * AI换装核心接口 - 使用 Replicate (SD生成服饰 + IDM-VTON换装)
 */
app.post('/api/dress', async (req, res) => {
  const startTime = Date.now()
  
  try {
    const { imageUrl, mode, dressType, dressName } = req.body
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: '缺少图片' })
    }
    
    if (!dressType) {
      return res.status(400).json({ success: false, message: '缺少服饰类型' })
    }

    console.log(`
🎎 换装请求: ${dressName} (${dressType}), 模式: ${mode}`)

    // 调用 Replicate AI 换装
    const { replicateDress } = require('./services/replicate-service')
    const resultImage = await replicateDress(imageUrl, dressType, mode, dressName)
    
    const duration = Date.now() - startTime
    console.log(`✅ 换装完成，耗时: ${Math.round(duration/1000)}s`)
    
    res.json({
      success: true,
      resultImage: resultImage,
      dressType: dressType,
      dressName: dressName,
      mode: mode,
      duration: duration,
      message: '换装成功'
    })

  } catch (err) {
    const duration = Date.now() - startTime
    console.error(`❌ 换装失败 (${duration}ms):`, err.message)
    
    res.status(500).json({ 
      success: false, 
      message: err.message || '换装服务异常',
      hint: err.message.includes('REPLICATE_API_TOKEN') 
        ? '请检查 Replicate API Token 配置' 
        : '请稍后重试'
    })
  }
})


/**
 * POST /api/dress
 * AI换装核心接口 - 使用 Replicate (SD生成服饰 + IDM-VTON换装)
 */
app.post('/api/dress', async (req, res) => {
  const startTime = Date.now()
  
  try {
    const { imageUrl, mode, dressType, dressName } = req.body
    
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: '缺少图片' })
    }
    
    if (!dressType) {
      return res.status(400).json({ success: false, message: '缺少服饰类型' })
    }

    console.log(`
🎎 换装请求: ${dressName} (${dressType}), 模式: ${mode}`)

    // 调用 Replicate AI 换装
    const { replicateDress } = require('./services/replicate-service')
    const resultImage = await replicateDress(imageUrl, dressType, mode, dressName)
    
    const duration = Date.now() - startTime
    console.log(`✅ 换装完成，耗时: ${Math.round(duration/1000)}s`)
    
    res.json({
      success: true,
      resultImage: resultImage,
      dressType: dressType,
      dressName: dressName,
      mode: mode,
      duration: duration,
      message: '换装成功'
    })

  } catch (err) {
    const duration = Date.now() - startTime
    console.error(`❌ 换装失败 (${duration}ms):`, err.message)
    
    res.status(500).json({ 
      success: false, 
      message: err.message || '换装服务异常',
      hint: err.message.includes('REPLICATE_API_TOKEN') 
        ? '请检查 Replicate API Token 配置' 
        : '请稍后重试'
    })
  }
})

/**
 * GET /api/nations
 * 获取56个民族服饰列表
 */
app.get('/api/nations', (req, res) => {
  const nations = require('./data/nations.json')
  res.json({ success: true, data: nations })
})

/**
 * GET /api/nations/:id/template
 * 获取指定民族的模板图URL
 */
app.get('/api/nations/:id/template', async (req, res) => {
  const { getTemplateUrl } = require('./services/aliyun-service')
  
  try {
    const nationId = req.params.id
    const gender = req.query.gender || 'female'
    const url = await getTemplateUrl(`nation_${nationId}`, gender)
    
    res.json({ success: true, url })
  } catch (err) {
    res.status(404).json({ success: false, message: err.message })
  }
})

/**
 * GET /api/themes
 * 获取婚礼主题风格列表
 */
app.get('/api/themes', (req, res) => {
  const themes = require('./data/themes.json')
  res.json({ success: true, data: themes })
})

/**
 * POST /api/upload/templates
 * 批量上传模板图到 OSS（管理员接口）
 */
app.post('/api/upload/templates', async (req, res) => {
  try {
    await uploadTemplatesToOSS()
    res.json({ success: true, message: '模板上传完成' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

/**
 * POST /api/test/aliyun
 * 测试阿里云连接（开发调试用）
 */
app.post('/api/test/aliyun', async (req, res) => {
  try {
    const ok = await testConnection()
    res.json({ success: ok, message: ok ? '连接成功' : '连接失败' })
  } catch (err) {
    res.json({ success: false, message: err.message })
  }
})

// ============================================================
// 错误处理
// ============================================================

app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  res.status(500).json({ success: false, message: err.message })
})

// ============================================================
// 启动
// ============================================================

app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║           民族婚礼换装馆 - 后端服务                       ║
║           AI换装服务商：Replicate (IDM-VTON)              ║
╠═══════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                          ║
║  健康检查: http://localhost:${PORT}/api/health               ║
║  换装接口: POST http://localhost:${PORT}/api/dress            ║
╚═══════════════════════════════════════════════════════════╝
  `)
  
  // 自动测试 Replicate 连接
  if (process.env.REPLICATE_API_TOKEN) {
    console.log('🔄 正在测试 Replicate 连接...')
    const ok = await testReplicateConnection()
    if (ok) {
      console.log('✅ Replicate 连接正常，AI换装服务已就绪！')
      console.log('   模型: IDM-VTON (IDM-VTON: Improving Diffusion Models for Authentic Virtual Try-on)')
    }
  } else {
    console.log('⚠️  未检测到 REPLICATE_API_TOKEN')
    console.log('   请设置环境变量: REPLICATE_API_TOKEN=你的API Token')
    console.log('   获取方式: https://replicate.com/account/api-tokens')
  }
})

module.exports = app
