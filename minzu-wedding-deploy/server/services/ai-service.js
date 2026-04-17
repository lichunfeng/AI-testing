/**
 * AI换装服务集成模块
 * 
 * 支持多种AI服务商，请根据实际情况选择并配置
 */

// ============ 方案1: 阿里云视觉智能 ============
/**
 * 阿里云人像换装
 * 需要安装: npm install @alicloud/openapi-client
 */
async function aliyunDress(imageUrl, dressType) {
  const DeepEAN = require('@alicloud/facebody20191230')
  
  const client = new DeepEAN({
    accessKeyId: process.env.ALIYUN_ACCESS_KEY,
    accessKeySecret: process.env.ALIYUN_ACCESS_SECRET,
    endpoint: 'facebody.cn-shanghai.aliyuncs.com'
  })

  // 人像分割
  const segmentRes = await client.segmentHumanBody({
    imageURL: imageUrl
  })
  
  // 服装合成（需要自定义模型）
  // 实际项目中需要准备各民族服饰的模板图
  
  return segmentRes.data.imageURL
}

// ============ 方案2: 腾讯云AI ============
/**
 * 腾讯云人像换装
 * 需要安装: npm install tencentcloud-sdk-nodejs
 */
async function tencentDress(imageUrl, dressType) {
  const tencentcloud = require('tencentcloud-sdk-nodejs')
  const { FaceFusionClient, FaceFusion } = tencentcloud.facefusion.v20181201
  
  const client = new FaceFusionClient({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: 'ap-guangzhou'
  })

  // 获取服饰模板（需要预先上传到COS）
  const templateUrl = await getTemplateUrl(dressType)
  
  const req = new FaceFusion()
  req.MergeInfos = [{
    ImageUrl: imageUrl,
    TemplateId: templateUrl
  }]
  
  const res = await client.FaceFusion(req)
  return res.ResultImageUrl
}

// ============ 方案3: Stable Diffusion ============
/**
 * Stable Diffusion 换装（效果最好）
 * 需要部署 SD API 服务（如 NovelAI, Stable Diffusion WebUI API）
 */
async function sdDress(imageUrl, dressName) {
  const axios = require('axios')
  
  // 构建prompt
  const prompt = buildSDPrompt(dressName)
  
  const response = await axios.post(process.env.SD_API_URL + '/v1/img2img', {
    prompt,
    negative_prompt: 'low quality, blurry, watermark',
    init_images: [imageUrl],
    denoising_strength: 0.7,
    cfg_scale: 7.5,
    steps: 30,
    width: 1024,
    height: 1024
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.SD_API_KEY}`,
      'Content-Type': 'application/json'
    }
  })
  
  return response.data.images[0]
}

/**
 * 根据民族构建SD prompt
 */
function buildSDPrompt(dressName) {
  const prompts = {
    '汉族': 'Chinese Hanfu wedding dress, phoenix crown, dragon and phoenix robe, red and gold colors, traditional Chinese wedding, elegant',
    '藏族': 'Tibetan traditional wedding dress, Tibetan robe, coral and turquoise jewelry, intricate embroidery, warm earth tones',
    '蒙古族': 'Mongolian traditional wedding dress, deel robe, fur trim, silver ornaments, grassland style',
    '苗族': 'Miao ethnic wedding dress, silver crown, elaborate silver jewelry, batik patterns, colorful embroidery',
    '维吾尔族': 'Uygur traditional wedding dress, colorful dress with intricate embroidery, doppa cap, elegant',
    '朝鲜族': 'Korean traditional wedding dress, hanbok, vibrant colors with pink and blue, elegant design',
    '满族': 'Manchu traditional wedding dress, qipao style, phoenix crown, dragon pattern, imperial style',
    '森系风': 'forest wedding theme, green leaves wreath, natural makeup, dreamy forest background, ethereal',
    '极简风': 'minimalist wedding, white dress, clean simple style, modern elegant, white background',
    '童话风': 'fairy tale wedding dress, princess dress, sparkle, castle background, magical atmosphere',
  }
  
  const basePrompt = prompts[dressName] || `${dressName} traditional wedding dress, high quality`
  
  return `${basePrompt}, professional photo, high detail, 8k, masterpiece`
}

// ============ 辅助函数 ============

/**
 * 获取服饰模板URL
 */
async function getTemplateUrl(dressType) {
  // 实际项目中：从数据库或COS获取模板
  const templates = {
    'nation_1': 'template-han-wedding.jpg',
    'nation_2': 'template-tibetan-wedding.jpg',
    'theme_senlin': 'template-forest.jpg',
    // ...
  }
  
  return templates[dressType] || 'default-wedding.jpg'
}

module.exports = {
  aliyunDress,
  tencentDress,
  sdDress,
  buildSDPrompt
}
