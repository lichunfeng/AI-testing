// pages/index/index.js
const app = getApp()

// 56个民族数据（婚礼服饰）
const NATIONS_DATA = [
  { id: 1, name: '汉族', pinyin: 'Hànzú', image: '/images/nations/han.png', desc: '凤冠霞帔，红典华贵' },
  { id: 2, name: '蒙古族', pinyin: 'Měnggǔzú', image: '/images/nations/mongol.png', desc: '草原风情，金饰华冠' },
  { id: 3, name: '回族', pinyin: 'Huízú', image: '/images/nations/hui.png', desc: '白色典雅，简洁端庄' },
  { id: 4, name: '藏族', pinyin: 'Zàngzú', image: '/images/nations/zang.png', desc: '藏袍华服，珠宝点缀' },
  { id: 5, name: '维吾尔族', pinyin: 'Wéiwúěrzú', image: '/images/nations/uighur.png', desc: '艾德莱斯绸，华丽刺绣' },
  { id: 6, name: '苗族', pinyin: 'Miáozú', image: '/images/nations/miao.png', desc: '银饰冠冕，刺绣华服' },
  { id: 7, name: '彝族', pinyin: 'Yízú', image: '/images/nations/yi.png', desc: '披毡大襟，银饰亮丽' },
  { id: 8, name: '壮族', pinyin: 'Zhuàngzú', image: '/images/nations/zhuang.png', desc: '蓝黑对襟，铜鼓纹样' },
  { id: 9, name: '布依族', pinyin: 'Bùyīzú', image: '/images/nations/buyi.png', desc: '蜡染蓝底，银铃叮当' },
  { id: 10, name: '朝鲜族', pinyin: 'Cháoxiǎnzú', image: '/images/nations/chaoxian.png', desc: '七彩短衣，长裙飘逸' },
  // ... 完整56个民族数据（为演示展示前10个）
]

// 婚礼主题风格
const THEMES_DATA = [
  { 
    id: 'senlin', 
    name: '森系风', 
    image: '/images/themes/senlin.png', 
    desc: '清新自然，绿植花环',
    colors: ['#4A7C59', '#E8F5E9', '#8BC34A']
  },
  { 
    id: 'jijian', 
    name: '极简风', 
    image: '/images/themes/jijian.png', 
    desc: '简约优雅，纯白设计',
    colors: ['#F5F5F5', '#9E9E9E', '#212121']
  },
  { 
    id: 'tonghua', 
    name: '童话风', 
    image: '/images/themes/tonghua.png', 
    desc: '梦幻浪漫，城堡公主',
    colors: ['#E91E63', '#9C27B0', '#FFD54F']
  }
]

Page({
  data: {
    mode: 'single', // 'single' | 'couple'
    hotNations: NATIONS_DATA.slice(0, 8),
    themes: THEMES_DATA
  },

  onLoad() {
    // 恢复之前的模式选择
    this.setData({ mode: app.globalData.dressMode || 'single' })
  },

  // 选择换装模式
  selectMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ mode })
    app.globalData.dressMode = mode
  },

  // 预览民族服饰
  previewNation(e) {
    const nation = e.currentTarget.dataset.nation
    wx.previewImage({
      urls: [nation.image],
      current: nation.image
    })
  },

  // 预览主题风格
  previewTheme(e) {
    const theme = e.currentTarget.dataset.theme
    wx.showModal({
      title: theme.name,
      content: theme.desc,
      showCancel: false
    })
  },

  // 开始换装
  startDress() {
    app.globalData.dressMode = this.data.mode
    wx.navigateTo({
      url: '/pages/upload/upload?mode=' + this.data.mode
    })
  },

  // 查看全部民族
  viewAllNations() {
    // TODO: 跳转到民族列表页面
    wx.showToast({ title: '敬请期待', icon: 'none' })
  }
})

// 导出完整民族数据供其他页面使用
module.exports = { NATIONS_DATA, THEMES_DATA }
