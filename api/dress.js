/**
 * Vercel Serverless Function - AI换装接口
 * 
 * 使用 Replicate IDM-VTON + SDXL 进行虚拟换装
 */

const axios = require('axios')
const FormData = require('form-data')

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || ''
const REPLICATE_API_URL = 'https://api.replicate.com/v1'

// 民族服饰描述词（部分演示）
const NATION_PROMPTS = {
  1: { name: '汉族', prompt: 'elegant Chinese bride wearing traditional Han wedding dress, phoenix crown, red silk embroidered qipao, golden dragon and phoenix patterns, professional photography' },
  2: { name: '蒙古族', prompt: 'beautiful bride wearing traditional Mongolian wedding dress, colorful deel robe with fur trim, silver ornaments, traditional Mongolian style' },
  3: { name: '回族', prompt: 'elegant bride wearing traditional Hui Muslim wedding dress, white embroidered gown, white headscarf, modest elegant style' },
  4: { name: '藏族', prompt: 'beautiful bride wearing traditional Tibetan wedding dress, chubang robe with fur trim, coral necklace, turquoise jewelry, Tibetan headdress' },
  5: { name: '维吾尔族', prompt: 'gorgeous bride wearing traditional Uyghur wedding dress, colorful embroidered silk dress, doppa embroidered cap, gold jewelry' },
  6: { name: '苗族', prompt: 'stunning bride wearing traditional Miao ethnic wedding dress, elaborate silver crown, heavy silver necklaces, intricate colorful embroidery' },
  7: { name: '彝族', prompt: 'beautiful bride wearing traditional Yi ethnic wedding dress, black embroidered robe, silver hair accessories' },
  8: { name: '壮族', prompt: 'elegant bride wearing traditional Zhuang ethnic wedding dress, blue-black embroidered jacket, ikat pattern skirt, silver hairpins' },
  9: { name: '布依族', prompt: 'beautiful bride wearing traditional Buyei ethnic wedding dress, blue batik dress with silver bells, intricate embroidery' },
  10: { name: '朝鲜族', prompt: 'elegant bride wearing traditional Korean ethnic wedding dress, colorful hanbok with pink and blue layers, elegant hair ornament' },
  11: { name: '满族', prompt: 'regal bride wearing traditional Manchu wedding dress, phoenix crown, elaborate dragon and phoenix embroidered qipao' },
  12: { name: '侗族', prompt: 'beautiful bride wearing traditional Dong ethnic wedding dress, silver crown with bell ornaments, embroidered jacket' },
  13: { name: '瑶族', prompt: 'stunning bride wearing traditional Yao ethnic wedding dress, red embroidered dress, silver crown, flower hair ornaments' },
  14: { name: '白族', prompt: 'elegant bride wearing traditional Bai ethnic wedding dress, white embroidered dress with blue accents' },
  15: { name: '土家族', prompt: 'beautiful bride wearing traditional Tujia ethnic wedding dress, embroidered blanket cape, colorful brocade pattern' },
}

const THEME_PROMPTS = {
  senlin: { name: '森系风', prompt: 'ethereal forest wedding dress, flower wreath crown, flowing white gown with green leaf embroidery, dreamy forest background' },
  jijian: { name: '极简风', prompt: 'minimalist modern wedding dress, clean white silk gown, simple elegant design, white background, soft lighting' },
  tonghua: { name: '童话风', prompt: 'fairy tale princess wedding dress, sparkle tulle gown, crystal tiara crown, magical sparkle effects, castle background' },
}

const NEGATIVE_PROMPT = 'lowres, bad anatomy, bad hands, text, watermark, blurry, deformed, ugly, extra limbs, worst quality, low quality, jpeg artifacts'

// ============ 辅助函数 ============

async function downloadImage(url) {
  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1]
    return Buffer.from(base64, 'base64')
  }
  if (url.startsWith('http')) {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 })
    return Buffer.from(response.data)
  }
  return null
}

async function uploadToReplicate(buffer) {
  const formData = new FormData()
  formData.append('file', buffer, 'image.png')
  
  const response = await axios.post(`${REPLICATE_API_URL}/files`, formData, {
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      ...formData.getHeaders()
    }
  })
  
  return response.data.urls.get
}

async function generateDressImage(prompt) {
  console.log('Generating dress image with SDXL...')
  
  const response = await axios.post(
    `${REPLICATE_API_URL}/predictions`,
    {
      version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea5255251b124f5f4e7d49a6f',
      input: {
        prompt: 'bride wearing ' + prompt,
        negative_prompt: NEGATIVE_PROMPT,
        width: 768,
        height: 1024,
        num_inference_steps: 20,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 999999)
      }
    },
    {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  return await pollPrediction(response.data.id, 60000)
}

async function virtualTryOn(personUrl, dressUrl, description) {
  console.log('Running virtual try-on...')
  
  const response = await axios.post(
    `${REPLICATE_API_URL}/predictions`,
    {
      version: '906425db3b1466189e5278a716baf5b1a91b2d935b0f7c5b45a1d2e38d5b5b2a',
      input: {
        garm_img: dressUrl,
        human_img: personUrl,
        garment_des: description,
        category: 'upper_body',
        is_checked: true,
        denoise_steps: 25,
        seed: 42
      }
    },
    {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  )
  
  return await pollPrediction(response.data.id, 120000)
}

async function pollPrediction(id, maxWait) {
  const start = Date.now()
  
  while (Date.now() - start < maxWait) {
    const response = await axios.get(
      `${REPLICATE_API_URL}/predictions/${id}`,
      { headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` } }
    )
    
    const status = response.data.status
    
    if (status === 'succeeded') return response.data.output
    if (status === 'failed') throw new Error(response.data.error || 'Generation failed')
    if (status === 'canceled') throw new Error('Generation canceled')
    
    await new Promise(r => setTimeout(r, 3000))
    console.log(`Status: ${status}...`)
  }
  
  throw new Error('Timeout waiting for result')
}

// ============ 主函数 ============

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
  
  const { imageUrl, dressType, dressName } = req.body || {}
  
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Missing imageUrl' })
  }
  
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ success: false, message: 'Replicate API token not configured' })
  }
  
  try {
    console.log(`Processing dress request: ${dressName} (${dressType})`)
    
    // 获取描述词
    let prompt = ''
    if (dressType?.startsWith('nation_')) {
      const id = parseInt(dressType.replace('nation_', ''))
      prompt = NATION_PROMPTS[id]?.prompt || NATION_PROMPTS[1].prompt
    } else if (dressType?.startsWith('theme_')) {
      const id = dressType.replace('theme_', '')
      prompt = THEME_PROMPTS[id]?.prompt || THEME_PROMPTS.senlin.prompt
    }
    
    // 步骤1：下载人物图片
    console.log('Downloading person image...')
    const personBuffer = await downloadImage(imageUrl)
    if (!personBuffer) throw new Error('Failed to download image')
    const personUrl = await uploadToReplicate(personBuffer)
    
    // 步骤2：生成服饰图
    console.log('Generating dress image...')
    const dressResult = await generateDressImage(prompt)
    const dressBuffer = Buffer.from(dressResult[0], 'base64')
    const dressUrl = await uploadToReplicate(dressBuffer)
    
    // 步骤3：虚拟换装
    console.log('Running virtual try-on...')
    const tryOnResult = await virtualTryOn(personUrl, dressUrl, dressName)
    
    // 返回结果
    const resultImage = tryOnResult[0] // 返回 base64
    
    console.log('Success!')
    return res.status(200).json({
      success: true,
      resultImage: resultImage,
      dressType,
      dressName,
      message: '换装成功'
    })
    
  } catch (err) {
    console.error('Error:', err.message)
    return res.status(500).json({
      success: false,
      message: err.message || '换装失败'
    })
  }
}
