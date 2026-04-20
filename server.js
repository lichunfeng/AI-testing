/**
 * 民族婚礼换装馆 - API 服务器
 * 适用于 Render.com / 任何 Node.js 托管平台
 */
const http = require('http')
const https = require('https')
const url = require('url')

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || ''
const PORT = process.env.PORT || 3000

const NATION_PROMPTS = {
  1: { name: '汉族', prompt: 'elegant Chinese bride wearing traditional Han wedding dress, phoenix crown, red silk embroidered qipao' },
  2: { name: '蒙古族', prompt: 'beautiful bride wearing traditional Mongolian wedding dress, colorful deel robe with fur trim' },
  3: { name: '回族', prompt: 'elegant bride wearing traditional Hui Muslim wedding dress, white embroidered gown' },
  4: { name: '藏族', prompt: 'beautiful bride wearing traditional Tibetan wedding dress, chubang robe, coral necklace, turquoise jewelry' },
  5: { name: '维吾尔族', prompt: 'gorgeous bride wearing traditional Uyghur wedding dress, colorful embroidered silk dress' },
  6: { name: '苗族', prompt: 'stunning bride wearing traditional Miao ethnic wedding dress, elaborate silver crown, heavy silver necklaces' },
  7: { name: '彝族', prompt: 'beautiful bride wearing traditional Yi ethnic wedding dress, black embroidered robe' },
  8: { name: '壮族', prompt: 'elegant bride wearing traditional Zhuang ethnic wedding dress, blue-black embroidered jacket' },
  9: { name: '布依族', prompt: 'beautiful bride wearing traditional Buyei ethnic wedding dress, blue batik dress with silver bells' },
  10: { name: '朝鲜族', prompt: 'elegant bride wearing traditional Korean ethnic wedding dress, colorful hanbok' },
  11: { name: '满族', prompt: 'regal bride wearing traditional Manchu wedding dress, phoenix crown, elaborate dragon embroidered qipao' },
  12: { name: '侗族', prompt: 'beautiful bride wearing traditional Dong ethnic wedding dress, silver crown with bell ornaments' },
  13: { name: '瑶族', prompt: 'stunning bride wearing traditional Yao ethnic wedding dress, red embroidered dress, silver crown' },
  14: { name: '白族', prompt: 'elegant bride wearing traditional Bai ethnic wedding dress, white embroidered dress with blue accents' },
  15: { name: '土家族', prompt: 'beautiful bride wearing traditional Tujia ethnic wedding dress, embroidered blanket cape' },
}

const THEME_PROMPTS = {
  senlin: { name: '森系风', prompt: 'ethereal forest wedding dress, flower wreath crown, flowing white gown with green leaf embroidery' },
  jijian: { name: '极简风', prompt: 'minimalist modern wedding dress, clean white silk gown, simple elegant design' },
  tonghua: { name: '童话风', prompt: 'fairy tale princess wedding dress, sparkle tulle gown, crystal tiara crown' },
}

function replicateRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.replicate.com',
      path: path,
      method: method,
      headers: {
        'Authorization': 'Token ' + REPLICATE_API_TOKEN,
        'Content-Type': 'application/json'
      }
    }
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error('Invalid JSON: ' + data)) }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function pollPrediction(id, maxWait) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const data = await replicateRequest('GET', '/v1/predictions/' + id)
    if (data.status === 'succeeded') return data.output
    if (data.status === 'failed' || data.status === 'canceled') throw new Error('Prediction ' + data.status)
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('Timeout waiting for prediction')
}

async function generateDress(prompt) {
  const data = await replicateRequest('POST', '/v1/predictions', {
    version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea5255251b124f5f4e7d49a6f',
    input: {
      prompt: 'a beautiful bride wearing ' + prompt + ', professional photography, high quality',
      negative_prompt: 'lowres, blurry, deformed, ugly, watermark, text',
      width: 768, height: 1024,
      num_inference_steps: 20,
      guidance_scale: 7.5,
      seed: Math.floor(Math.random() * 999999)
    }
  })
  return pollPrediction(data.id, 60000)
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}) }
      catch (e) { reject(new Error('Invalid JSON body')) }
    })
  })
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  const parsedUrl = url.parse(req.url, true)
  const pathname = parsedUrl.pathname

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    return res.end()
  }

  // 健康检查
  if (pathname === '/' || pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({
      status: 'ok',
      message: '民族婚礼换装馆 API 运行中',
      token: REPLICATE_API_TOKEN ? '已配置' : '未配置'
    }))
  }

  // 换装接口
  if (pathname === '/api/dress' && req.method === 'POST') {
    try {
      const body = await parseBody(req)
      const { imageUrl, dressType, dressName } = body

      if (!REPLICATE_API_TOKEN) {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ success: false, message: 'REPLICATE_API_TOKEN 未配置' }))
      }

      if (!imageUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ success: false, message: '缺少 imageUrl 参数' }))
      }

      let prompt = ''
      if (dressType && dressType.startsWith('nation_')) {
        const id = parseInt(dressType.replace('nation_', ''))
        prompt = (NATION_PROMPTS[id] || NATION_PROMPTS[1]).prompt
      } else if (dressType && dressType.startsWith('theme_')) {
        const id = dressType.replace('theme_', '')
        prompt = (THEME_PROMPTS[id] || THEME_PROMPTS.senlin).prompt
      } else {
        prompt = NATION_PROMPTS[1].prompt
      }

      const result = await generateDress(prompt)
      const resultImage = Array.isArray(result) ? result[0] : result

      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({
        success: true,
        resultImage,
        dressType,
        dressName: dressName || dressType
      }))
    } catch (err) {
      console.error('换装错误:', err.message)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ success: false, message: err.message }))
    }
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found', path: pathname }))
})

server.listen(PORT, () => {
  console.log('🎎 民族婚礼换装馆 API 启动成功')
  console.log('端口:', PORT)
  console.log('Replicate Token:', REPLICATE_API_TOKEN ? '已配置 ✅' : '未配置 ❌')
})
