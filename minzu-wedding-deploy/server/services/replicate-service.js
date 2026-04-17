/**
 * Replicate AI 换装服务
 * 
 * 模型：IDM-VTON（虚拟换装）+ SDXL（生成服饰图）
 * 
 * 流程：
 * 1. 用描述词生成民族服饰图（SDXL）
 * 2. 将服饰图和人物图合成（IDM-VTON）
 */

const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')
const os = require('os')

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || ''
const REPLICATE_API_URL = 'https://api.replicate.com/v1'

// ============ 民族服饰描述词 ============
const NATION_PROMPTS = {
  1: { name: '汉族', prompt: 'traditional Chinese Han wedding dress, phoenix crown, red silk qipao, golden dragon and phoenix embroidery, elegant bride, professional photo' },
  2: { name: '蒙古族', prompt: 'traditional Mongolian wedding dress, colorful deel robe with fur trim, silver ornaments, traditional Mongolian style, professional photo' },
  3: { name: '回族', prompt: 'traditional Hui Muslim wedding dress, white embroidered gown, white headscarf, modest elegant style, professional photo' },
  4: { name: '藏族', prompt: 'traditional Tibetan wedding dress, chubang robe with fur trim, coral necklace, turquoise jewelry, Tibetan headdress, professional photo' },
  5: { name: '维吾尔族', prompt: 'traditional Uyghur wedding dress, colorful embroidered silk dress, doppa embroidered cap, gold jewelry, vibrant patterns, professional photo' },
  6: { name: '苗族', prompt: 'traditional Miao ethnic wedding dress, elaborate silver crown, heavy silver necklaces, bat wing sleeves with intricate colorful embroidery, professional photo' },
  7: { name: '彝族', prompt: 'traditional Yi ethnic wedding dress, black embroidered robe, silver hair accessories, Yi ethnic style, professional photo' },
  8: { name: '壮族', prompt: 'traditional Zhuang ethnic wedding dress, blue-black embroidered jacket, ikat pattern skirt, silver hairpins, professional photo' },
  9: { name: '布依族', prompt: 'traditional Buyei ethnic wedding dress, blue batik dress with silver bells, intricate embroidery, professional photo' },
  10: { name: '朝鲜族', prompt: 'traditional Korean ethnic wedding dress, colorful hanbok with pink and blue layers, elegant hair ornament, professional photo' },
  11: { name: '满族', prompt: 'traditional Manchu wedding dress, phoenix crown, elaborate dragon and phoenix embroidered qipao, imperial style, professional photo' },
  12: { name: '侗族', prompt: 'traditional Dong ethnic wedding dress, silver crown with bell ornaments, embroidered jacket with intricate patterns, professional photo' },
  13: { name: '瑶族', prompt: 'traditional Yao ethnic wedding dress, red embroidered dress, silver crown, flower hair ornaments, Yao ethnic style, professional photo' },
  14: { name: '白族', prompt: 'traditional Bai ethnic wedding dress, white embroidered dress with blue accents, Bai ethnic style, wind flower snow moon aesthetic, professional photo' },
  15: { name: '土家族', prompt: 'traditional Tujia ethnic wedding dress, xilan kapu embroidered blanket cape, colorful brocade pattern, professional photo' },
}

// 主题风格描述词
const THEME_PROMPTS = {
  senlin: { name: '森系风', prompt: 'ethereal forest wedding dress, flower wreath crown, flowing white gown with green leaf embroidery, natural makeup, dreamy forest background, professional photo' },
  jijian: { name: '极简风', prompt: 'minimalist modern wedding dress, clean white silk gown, simple elegant design, white background, soft natural lighting, professional photo' },
  tonghua: { name: '童话风', prompt: 'fairy tale princess wedding dress, sparkle tulle gown, crystal tiara crown, magical sparkle effects, castle background, professional photo' },
}

const NEGATIVE_PROMPT = 'lowres, bad anatomy, bad hands, text, watermark, signature, blurry, deformed, ugly, disfigured, mutation, mutated, extra limbs, extra fingers, fewer limbs, disconnected limbs, worst quality, low quality, jpeg artifacts, cropped, watermark'

// ============ 辅助函数 ============

/**
 * 下载图片为 Buffer
 */
async function downloadImage(url) {
  if (url.startsWith('data:')) {
    const base64 = url.split(',')[1]
    return Buffer.from(base64, 'base64')
  }
  if (url.startsWith('http')) {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 })
    return Buffer.from(response.data)
  }
  return fs.readFileSync(url)
}

/**
 * 上传图片到 Replicate，获取 URL
 */
async function uploadImageToReplicate(buffer, filename = 'image.png') {
  const formData = new FormData()
  formData.append('file', buffer, filename)
  
  const response = await axios.post(`${REPLICATE_API_URL}/files`, formData, {
    headers: {
      'Authorization': `Token ${REPLICATE_API_TOKEN}`,
      ...formData.getHeaders()
    }
  })
  
  return response.data.urls.get
}

/**
 * 用 SD 生成民族服饰图
 */
async function generateDressImage(prompt, nationId, gender = 'female') {
  console.log('  [1/4] 生成服饰图 (SDXL)...')
  
  // 构建性别适配的提示词
  const genderPrefix = gender === 'male' 
    ? 'man groom wearing ' 
    : 'bride wearing '
  
  const fullPrompt = genderPrefix + prompt
  
  const response = await axios.post(
    `${REPLICATE_API_URL}/predictions`,
    {
      version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea5255251b124f5f4e7d49a6f',
      input: {
        prompt: fullPrompt,
        negative_prompt: NEGATIVE_PROMPT,
        width: 768,
        height: 1024,
        num_inference_steps: 25,
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
  
  const predictionId = response.data.id
  console.log(`    任务ID: ${predictionId}`)
  
  // 轮询结果
  const result = await pollPrediction(predictionId, 60000)
  
  // SD 返回的是 base64 数组
  if (Array.isArray(result)) {
    const base64 = result[0]
    return Buffer.from(base64, 'base64')
  }
  
  // 也可能是 URL
  if (typeof result === 'string') {
    return await downloadImage(result)
  }
  
  throw new Error('SD生成结果格式异常')
}

/**
 * IDM-VTON 虚拟换装
 */
async function virtualTryOn(personImageUrl, dressImageUrl, description) {
  console.log('  [2/4] 上传人物图...')
  const personBuffer = await downloadImage(personImageUrl)
  const personUrl = await uploadImageToReplicate(personBuffer, 'person.png')
  
  console.log('  [3/4] 上传服饰图...')
  const dressBuffer = await downloadImage(dressImageUrl)
  const dressUrl = await uploadImageToReplicate(dressBuffer, 'dress.png')
  
  console.log('  [4/4] AI换装中 (IDM-VTON)...')
  
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
        is_checked_crop: false,
        denoise_steps: 30,
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
  
  const predictionId = response.data.id
  console.log(`    换装任务ID: ${predictionId}`)
  
  return await pollPrediction(predictionId, 120000)
}

/**
 * 轮询预测结果
 */
async function pollPrediction(predictionId, maxWait = 120000) {
  const start = Date.now()
  
  while (Date.now() - start < maxWait) {
    const response = await axios.get(
      `${REPLICATE_API_URL}/predictions/${predictionId}`,
      { headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` } }
    )
    
    const status = response.data.status
    
    if (status === 'succeeded') {
      return response.data.output
    }
    if (status === 'failed') {
      throw new Error(`预测失败: ${response.data.error}`)
    }
    if (status === 'canceled') {
      throw new Error('预测被取消')
    }
    
    console.log(`    ${status}... (${Math.round((Date.now() - start) / 1000)}s)`)
    await sleep(3000)
  }
  
  throw new Error('等待超时')
}

// ============ 主函数 ============

/**
 * AI 换装入口
 * 
 * @param {string} personImageUrl - 人物照片 URL
 * @param {string} dressId - 服饰ID，如 'nation_1', 'theme_senlin'
 * @param {string} mode - 'single' | 'couple'
 * @param {string} dressName - 服饰名称
 * @returns {Promise<string>} - 换装结果图 URL
 */
async function replicateDress(personImageUrl, dressId, mode = 'single', dressName = '') {
  if (!REPLICATE_API_TOKEN) {
    throw new Error('未配置 REPLICATE_API_TOKEN')
  }
  
  console.log(`\n🎎 AI 换装开始...`)
  console.log(`  服饰: ${dressName}`)
  
  const startTime = Date.now()
  
  try {
    // 步骤1：获取描述词
    let prompt, gender = 'female'
    
    if (dressId.startsWith('nation_')) {
      const nationId = parseInt(dressId.replace('nation_', ''))
      const nation = NATION_PROMPTS[nationId]
      if (!nation) {
        throw new Error(`未找到民族ID: ${nationId}`)
      }
      prompt = nation.prompt
      console.log(`  民族: ${nation.name}`)
    } else if (dressId.startsWith('theme_')) {
      const themeId = dressId.replace('theme_', '')
      const theme = THEME_PROMPTS[themeId]
      if (!theme) {
        throw new Error(`未找到主题: ${themeId}`)
      }
      prompt = theme.prompt
      console.log(`  主题: ${theme.name}`)
    } else {
      throw new Error(`无效的服饰ID: ${dressId}`)
    }
    
    // 步骤2：用 SD 生成服饰图
    console.log(`  [1/2] 生成 ${gender} 服饰图...`)
    const dressBuffer = await generateDressImage(prompt, dressId, gender)
    const dressUrl = await uploadImageToReplicate(dressBuffer, `dress-${Date.now()}.png`)
    console.log(`  ✅ 服饰图生成完成`)
    
    // 步骤3：IDM-VTON 换装
    console.log(`  [2/2] AI换装中...`)
    const result = await virtualTryOn(personImageUrl, dressUrl, dressName)
    
    // 处理返回结果
    let resultImageUrl
    if (Array.isArray(result)) {
      resultImageUrl = result[0] // base64
    } else if (typeof result === 'string') {
      resultImageUrl = result // URL
    } else {
      throw new Error('换装结果格式异常')
    }
    
    const duration = Date.now() - startTime
    console.log(`  ✅ 换装完成！耗时: ${Math.round(duration / 1000)}s`)
    
    return resultImageUrl
    
  } catch (err) {
    console.error(`❌ 换装失败:`, err.message)
    throw err
  }
}

/**
 * 测试连接
 */
async function testReplicateConnection() {
  if (!REPLICATE_API_TOKEN) {
    console.log('❌ 未配置 REPLICATE_API_TOKEN')
    return false
  }
  
  try {
    const response = await axios.get(
      `${REPLICATE_API_URL}/models/cuuupid/idm-vton`,
      { headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` } }
    )
    
    console.log('✅ Replicate 连接成功！')
    console.log(`  模型: ${response.data.name}`)
    console.log(`  描述: ${response.data.description.substring(0, 100)}...`)
    return true
  } catch (err) {
    console.error('❌ Replicate 连接失败:', err.message)
    if (err.response?.status === 401) {
      console.error('   → API Token 无效')
    }
    return false
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
  replicateDress,
  testReplicateConnection,
  NATION_PROMPTS,
  THEME_PROMPTS
}
