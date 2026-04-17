/**
 * Vercel Serverless Function - 图片上传
 * 
 * 将小程序上传的图片转发到 Replicate
 */

const axios = require('axios')
const FormData = require('form-data')

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || ''

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }
  
  const { imageUrl, filename } = req.body || {}
  
  if (!imageUrl) {
    return res.status(400).json({ success: false, message: 'Missing imageUrl' })
  }
  
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ success: false, message: 'API token not configured' })
  }
  
  try {
    // 下载图片
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 })
    const buffer = Buffer.from(response.data)
    
    // 上传到 Replicate
    const formData = new FormData()
    formData.append('file', buffer, filename || 'image.png')
    
    const uploadRes = await axios.post('https://api.replicate.com/v1/files', formData, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        ...formData.getHeaders()
      }
    })
    
    return res.status(200).json({
      success: true,
      url: uploadRes.data.urls.get
    })
    
  } catch (err) {
    console.error('Upload error:', err.message)
    return res.status(500).json({
      success: false,
      message: err.message
    })
  }
}
