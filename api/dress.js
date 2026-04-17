/**
 * Vercel Serverless - AI换装接口
 */
const axios = require('axios')
const FormData = require('form-data')

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || ''

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

async function downloadImage(url) {
  if (!url || url === 'test') return Buffer.alloc(0)
  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1]
    return Buffer.from(base64, 'base64')
  }
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
  return Buffer.from(response.data)
}

async function uploadToReplicate(buffer) {
  const formData = new FormData()
  formData.append('file', buffer, 'image.png')
  const response = await axios.post('https://api.replicate.com/v1/files', formData, {
    headers: { 'Authorization': 'Token ' + REPLICATE_API_TOKEN, ...formData.getHeaders() }
  })
  return response.data.urls.get
}

async function pollPrediction(id, maxWait) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    const response = await axios.get('https://api.replicate.com/v1/predictions/' + id, {
      headers: { 'Authorization': 'Token ' + REPLICATE_API_TOKEN }
    })
    const status = response.data.status
    if (status === 'succeeded') return response.data.output
    if (status === 'failed' || status === 'canceled') throw new Error(status)
    await new Promise(r => setTimeout(r, 3000))
  }
  throw new Error('Timeout')
}

async function generateDress(prompt) {
  const response = await axios.post('https://api.replicate.com/v1/predictions', {
    version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea5255251b124f5f4e7d49a6f',
    input: {
      prompt: 'bride wearing ' + prompt,
      negative_prompt: 'lowres, blurry, deformed, ugly, watermark',
      width: 768, height: 1024, num_inference_steps: 20, guidance_scale: 7.5,
      seed: Math.floor(Math.random() * 999999)
    }
  }, { headers: { 'Authorization': 'Token ' + REPLICATE_API_TOKEN, 'Content-Type': 'application/json' } })
  return pollPrediction(response.data.id, 60000)
}

async function tryOn(personUrl, dressUrl, desc) {
  const response = await axios.post('https://api.replicate.com/v1/predictions', {
    version: '906425db3b1466189e5278a716baf5b1a91b2d935b0f7c5b45a1d2e38d5b5b2a',
    input: {
      garm_img: dressUrl, human_img: personUrl, garment_des: desc,
      category: 'upper_body', is_checked: true, denoise_steps: 25, seed: 42
    }
  }, { headers: { 'Authorization': 'Token ' + REPLICATE_API_TOKEN, 'Content-Type': 'application/json' } })
  return pollPrediction(response.data.id, 120000)
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' })
  
  const { imageUrl, dressType, dressName } = req.body || {}
  if (!REPLICATE_API_TOKEN) return res.status(500).json({ success: false, message: 'API token not configured' })
  if (!imageUrl) return res.status(400).json({ success: false, message: 'Missing imageUrl' })
  
  try {
    let prompt = ''
    if (dressType?.startsWith('nation_')) {
      const id = parseInt(dressType.replace('nation_', ''))
      prompt = NATION_PROMPTS[id]?.prompt || NATION_PROMPTS[1].prompt
    } else if (dressType?.startsWith('theme_')) {
      const id = dressType.replace('theme_', '')
      prompt = THEME_PROMPTS[id]?.prompt || THEME_PROMPTS.senlin.prompt
    }
    
    const personBuffer = await downloadImage(imageUrl)
    const personUrl = await uploadToReplicate(personBuffer)
    const dressResult = await generateDress(prompt)
    const dressBuffer = Buffer.from(dressResult[0], 'base64')
    const dressUrl = await uploadToReplicate(dressBuffer)
    const tryOnResult = await tryOn(personUrl, dressUrl, dressName || dressType)
    
    return res.status(200).json({ success: true, resultImage: tryOnResult[0], dressType, dressName })
  } catch (err) {
    console.error('Error:', err.message)
    return res.status(500).json({ success: false, message: err.message })
  }
}
