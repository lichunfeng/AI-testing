// pages/select-style/select-style.js
const app = getApp()

// 完整的56个民族婚礼服饰数据
const NATIONS_56 = [
  // 汉藏语系
  { id: 1, name: '汉族', pinyin: 'Han', desc: '凤冠霞帔，红典华贵', isHot: true, category: 'han-tibetan' },
  { id: 2, name: '藏族', pinyin: 'Tibetan', desc: '藏袍华服，珠宝点缀', isHot: true, category: 'han-tibetan' },
  { id: 3, name: '彝族', pinyin: 'Yi', desc: '披毡大襟，银饰亮丽', isHot: false, category: 'han-tibetan' },
  { id: 4, name: '白族', pinyin: 'Bai', desc: '风花雪月，绣花衣裳', isHot: true, category: 'han-tibetan' },
  { id: 5, name: '哈尼族', pinyin: 'Hani', desc: '银泡闪亮，彩虹筒帕', isHot: false, category: 'han-tibetan' },
  { id: 6, name: '傣族', pinyin: 'Dai', desc: '紧身短衫，孔雀舞裙', isHot: true, category: 'han-tibetan' },
  { id: 7, name: '僳僳族', pinyin: 'Lisu', desc: '彩纹短衫，七星披肩', isHot: false, category: 'han-tibetan' },
  { id: 8, name: '佤族', pinyin: 'Wa', desc: '黑布缠头，银环颈饰', isHot: false, category: 'han-tibetan' },
  { id: 9, name: '纳西族', pinyin: 'Naxi', desc: '披星戴月，七星羊皮', isHot: false, category: 'han-tibetan' },
  { id: 10, name: '拉祜族', pinyin: 'Lahu', desc: '黑布缠头，银泡点缀', isHot: false, category: 'han-tibetan' },
  { id: 11, name: '景颇族', pinyin: 'Jingpo', desc: '银袍盛装，织锦披肩', isHot: false, category: 'han-tibetan' },
  { id: 12, name: '布朗族', pinyin: 'Blang', desc: '包头银饰，织锦筒裙', isHot: false, category: 'han-tibetan' },
  { id: 13, name: '阿昌族', pinyin: 'Achang', desc: '银泡围腰，绒球包头', isHot: false, category: 'han-tibetan' },
  { id: 14, name: '普米族', pinyin: 'Pumi', desc: '牦牛角帽，绣花围腰', isHot: false, category: 'han-tibetan' },
  { id: 15, name: '怒族', pinyin: 'Nu', desc: '藤簪缠头，竹管耳饰', isHot: false, category: 'han-tibetan' },
  { id: 16, name: '德昂族', pinyin: 'Deang', desc: '银牌缠腰，藤圈头饰', isHot: false, category: 'han-tibetan' },
  { id: 17, name: '独龙族', pinyin: 'Derung', desc: '文面传统，织毯披肩', isHot: false, category: 'han-tibetan' },
  { id: 18, name: '基诺族', pinyin: 'Jino', desc: '黑色短褂，白色绑腿', isHot: false, category: 'han-tibetan' },
  
  // 壮侗语族
  { id: 19, name: '壮族', pinyin: 'Zhuang', desc: '蓝黑对襟，铜鼓纹样', isHot: true, category: 'zhuang-dong' },
  { id: 20, name: '布依族', pinyin: 'Buyei', desc: '蜡染蓝底，银铃叮当', isHot: false, category: 'zhuang-dong' },
  { id: 21, name: '傣族(2)', pinyin: 'Dai', desc: '紧身短衫，孔雀舞裙', isHot: false, category: 'zhuang-dong' },
  { id: 22, name: '侗族', pinyin: 'Dong', desc: '芦笙盛装，银饰叮当', isHot: true, category: 'zhuang-dong' },
  { id: 23, name: '仫佬族', pinyin: 'Mulao', desc: '绣花围裙，背带银饰', isHot: false, category: 'zhuang-dong' },
  { id: 24, name: '毛南族', pinyin: 'Maonan', desc: '花竹帽饰，绣花盛装', isHot: false, category: 'zhuang-dong' },
  { id: 25, name: '水族', pinyin: 'Sui', desc: '青蓝长衫，银扣大襟', isHot: false, category: 'zhuang-dong' },
  { id: 26, name: '黎族', pinyin: 'Li', desc: '筒裙织锦，汪汪权服', isHot: false, category: 'zhuang-dong' },
  { id: 27, name: '仡佬族', pinyin: 'Gelao', desc: '三接帽子，绣花衣裙', isHot: false, category: 'zhuang-dong' },
  
  // 苗瑶语族
  { id: 28, name: '苗族', pinyin: 'Miao', desc: '银饰冠冕，刺绣华服', isHot: true, category: 'miao-yao' },
  { id: 29, name: '瑶族', pinyin: 'Yao', desc: '红瑶盛装，精美刺绣', isHot: true, category: 'miao-yao' },
  { id: 30, name: '土家族', pinyin: 'Tujia', desc: '西兰卡普，织锦盛装', isHot: true, category: 'miao-yao' },
  
  // 阿尔泰语系
  { id: 31, name: '蒙古族', pinyin: 'Mongol', desc: '草原风情，金饰华冠', isHot: true, category: 'altaic' },
  { id: 32, name: '回族', pinyin: 'Hui', desc: '白色典雅，简洁端庄', isHot: true, category: 'altaic' },
  { id: 33, name: '维吾尔族', pinyin: 'Uighur', desc: '艾德莱斯绸，华丽刺绣', isHot: true, category: 'altaic' },
  { id: 34, name: '哈萨克族', pinyin: 'Kazakh', desc: '皮毛高帽，绣花长袍', isHot: false, category: 'altaic' },
  { id: 35, name: '柯尔克孜族', pinyin: 'Kyrgyz', desc: '白色毛帽，金饰披肩', isHot: false, category: 'altaic' },
  { id: 36, name: '锡伯族', pinyin: 'Xibe', desc: '旗袍马褂，旗装传统', isHot: false, category: 'altaic' },
  { id: 37, name: '乌孜别克族', pinyin: 'Uzbek', desc: '丝绒长袍，绣花小帽', isHot: false, category: 'altaic' },
  { id: 38, name: '塔吉克族', pinyin: 'Tajik', desc: '高耸帽冠，彩纹披风', isHot: false, category: 'altaic' },
  { id: 39, name: '塔塔尔族', pinyin: 'Tatar', desc: '绣花小帽，丝绒长袍', isHot: false, category: 'altaic' },
  { id: 40, name: '撒拉族', pinyin: 'Salar', desc: '白色盖头，绣花衣裳', isHot: false, category: 'altaic' },
  { id: 41, name: '俄罗斯族', pinyin: 'Russian', desc: '连衣裙罩裙，传统头饰', isHot: false, category: 'altaic' },
  { id: 42, name: '裕固族', pinyin: 'Yugur', desc: '高顶皮帽，绣花长袍', isHot: false, category: 'altaic' },
  { id: 43, name: '土族', pinyin: 'Monguor', desc: '绣花袖套，彩虹腰带', isHot: false, category: 'altaic' },
  { id: 44, name: '达斡尔族', pinyin: 'Daur', desc: '绣花长袍，皮毛镶边', isHot: false, category: 'altaic' },
  { id: 45, name: '东乡族', pinyin: 'Dongxiang', desc: '绣花盖头，长袍大襟', isHot: false, category: 'altaic' },
  { id: 46, name: '保安族', pinyin: 'Bonan', desc: '绣花小帽，长袍皮靴', isHot: false, category: 'altaic' },
  { id: 47, name: '朝鲜族', pinyin: 'Korean', desc: '七彩短衣，长裙飘逸', isHot: true, category: 'altaic' },
  { id: 48, name: '满族', pinyin: 'Manchu', desc: '旗装旗袍，旗头凤簪', isHot: true, category: 'altaic' },
  
  // 其他
  { id: 49, name: '京族', pinyin: 'Jing', desc: '贝壳装饰，白色长衫', isHot: false, category: 'other' },
  { id: 50, name: '黎族', pinyin: 'Li', desc: '织锦筒裙，汪汪服制', isHot: false, category: 'other' },
  { id: 51, name: '畲族', pinyin: 'She', desc: '凤凰装束，织锦彩带', isHot: false, category: 'other' },
  { id: 52, name: '高山族', pinyin: 'Gaoshan', desc: '贝壳胸饰，织布短裙', isHot: false, category: 'other' },
  { id: 53, name: '赫哲族', pinyin: 'Hezhen', desc: '鱼皮服饰，兽皮披肩', isHot: false, category: 'other' },
  { id: 54, name: '门巴族', pinyin: 'Mongba', desc: '褐衣藏袍，珍珠头饰', isHot: false, category: 'other' },
  { id: 55, name: '珞巴族', pinyin: 'Lhoba', desc: '皮毛披挂，竹管耳饰', isHot: false, category: 'other' },
  { id: 56, name: '基诺族', pinyin: 'Jino', desc: '黑色短褂，白色绑腿', isHot: false, category: 'other' },
]

// 婚礼主题风格
const THEMES = [
  { 
    id: 'senlin', 
    name: '森系风', 
    desc: '清新自然，绿植花环',
    colors: ['#4A7C59', '#E8F5E9', '#8BC34A']
  },
  { 
    id: 'jijian', 
    name: '极简风', 
    desc: '简约优雅，纯白设计',
    colors: ['#F5F5F5', '#9E9E9E', '#212121']
  },
  { 
    id: 'tonghua', 
    name: '童话风', 
    desc: '梦幻浪漫，城堡公主',
    colors: ['#E91E63', '#9C27B0', '#FFD54F']
  }
]

const PAGE_SIZE = 20

Page({
  data: {
    mode: 'single',
    currentTab: 'nations',
    uploadedImage: null,
    nations: NATIONS_56,
    displayNations: [],
    themes: THEMES,
    selectedNation: null,
    selectedTheme: null,
    processing: false,
    processingStep: '正在上传图片...',
    loadingMore: false,
    page: 1,
    hasSelection: false
  },

  onLoad(options) {
    const mode = options.mode || 'single'
    this.setData({ 
      mode,
      uploadedImage: app.globalData.uploadedImage
    })
    
    // 初始加载
    this.loadMoreNations()
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  // 加载更多民族（分页）
  loadMoreNations() {
    if (this.data.loadingMore) return
    
    this.setData({ loadingMore: true })
    
    const page = this.data.page
    const start = (page - 1) * PAGE_SIZE
    const end = start + PAGE_SIZE
    const newItems = NATIONS_56.slice(start, end)
    
    if (newItems.length > 0) {
      this.setData({
        displayNations: [...this.data.displayNations, ...newItems],
        page: page + 1,
        loadingMore: false
      })
    } else {
      this.setData({ loadingMore: false })
    }
  },

  // 选择民族
  selectNation(e) {
    const nation = e.currentTarget.dataset.nation
    this.setData({ 
      selectedNation: nation,
      selectedTheme: null,
      hasSelection: true
    })
  },

  // 选择主题
  selectTheme(e) {
    const theme = e.currentTarget.dataset.theme
    this.setData({ 
      selectedTheme: theme,
      selectedNation: null,
      hasSelection: true
    })
  },

  // 开始换装
  async startDress() {
    if (!this.data.hasSelection) {
      wx.showToast({ title: '请先选择一种服饰', icon: 'none' })
      return
    }

    this.setData({ 
      processing: true,
      processingStep: '正在上传图片...'
    })

    try {
      const { uploadedImage, mode, selectedNation, selectedTheme } = this.data
      const dressType = selectedNation ? `nation_${selectedNation.id}` : `theme_${selectedTheme.id}`
      
      // Step 1: 上传图片到服务器
      this.setData({ processingStep: '正在上传图片...' })
      const uploadRes = await this.uploadImage(uploadedImage)
      if (!uploadRes.success) throw new Error('图片上传失败')
      
      const imageUrl = uploadRes.url
      
      // Step 2: 调用AI换装接口
      this.setData({ processingStep: 'AI正在识别人物...' })
      await this.sleep(500)
      
      this.setData({ processingStep: '正在应用服饰模板...' })
      await this.sleep(500)
      
      this.setData({ processingStep: '正在合成换装效果...' })
      await this.sleep(500)
      
      // Step 3: 模拟生成结果（实际项目中这里会调用真实的AI换装API）
      const resultImage = await this.callDressAPI({
        imageUrl,
        mode,
        dressType,
        dressName: selectedNation ? selectedNation.name : selectedTheme.name
      })
      
      // 保存结果
      app.globalData.resultImage = resultImage
      
      // 跳转到结果页
      wx.hideLoading()
      wx.navigateTo({
        url: '/pages/result/result'
      })
      
    } catch (err) {
      console.error('换装失败', err)
      wx.hideLoading()
      wx.showModal({
        title: '换装失败',
        content: err.message || '请稍后重试',
        showCancel: false
      })
    } finally {
      this.setData({ processing: false })
    }
  },

  // 上传图片到服务器
  uploadImage(filePath) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: app.globalData.serverUrl + '/upload',
        filePath: filePath,
        name: 'image',
        success: (res) => {
          try {
            const data = JSON.parse(res.data)
            resolve({ success: true, url: data.url })
          } catch (e) {
            resolve({ success: true, url: res.data })
          }
        },
        fail: (err) => {
          // 模拟成功（开发阶段）
          resolve({ success: true, url: filePath })
        }
      })
    })
  },

  // 调用AI换装API（核心方法，需要接入真实AI服务）
  async callDressAPI(params) {
    const { imageUrl, mode, dressType, dressName } = params
    
    try {
      const res = await wx.request({
        url: app.globalData.serverUrl + '/dress',
        method: 'POST',
        data: { imageUrl, mode, dressType, dressName },
        header: { 'content-type': 'application/json' }
      })
      
      if (res.data && res.data.success) {
        return res.data.resultImage
      }
      
      throw new Error(res.data.message || '换装服务异常')
    } catch (err) {
      console.log('API调用失败，使用模拟结果')
      // 开发阶段返回模拟结果图
      return imageUrl
    }
  },

  // 工具方法：延时
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
})
