// pages/result/result.js
const app = getApp()

Page({
  data: {
    resultImage: '',
    styleName: '',
    mode: 'single',
    suggestions: [
      { id: 1, name: '藏族', image: '/images/nations/zang.png' },
      { id: 2, name: '苗族', image: '/images/nations/miao.png' },
      { id: 3, name: '朝鲜族', image: '/images/nations/chaoxian.png' },
      { id: 4, name: '森系风', image: '/images/themes/senlin.png' },
      { id: 5, name: '童话风', image: '/images/themes/tonghua.png' },
      { id: 6, name: '维吾尔族', image: '/images/nations/uighur.png' },
    ],
    showShareModal: false
  },

  onLoad() {
    const resultImage = app.globalData.resultImage || app.globalData.uploadedImage
    const styleName = app.globalData.selectedStyle?.name || app.globalData.selectedNation?.name || '婚礼服饰'
    const mode = app.globalData.dressMode || 'single'
    
    this.setData({
      resultImage,
      styleName,
      mode
    })
  },

  // 预览结果大图
  previewResult() {
    wx.previewImage({
      urls: [this.data.resultImage],
      current: this.data.resultImage
    })
  },

  // 保存到相册
  saveToAlbum() {
    wx.showLoading({ title: '保存中...' })
    
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => this.doSave(),
            fail: () => {
              wx.hideLoading()
              wx.showModal({
                title: '需要相册权限',
                content: '请在设置中开启相册权限',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) wx.openSetting()
                }
              })
            }
          })
        } else {
          this.doSave()
        }
      }
    })
  },

  doSave() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultImage,
      success: () => {
        wx.hideLoading()
        wx.showToast({ title: '保存成功', icon: 'success' })
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '保存失败', icon: 'none' })
        console.error('保存失败', err)
      }
    })
  },

  // 分享给好友
  shareToFriend() {
    this.setData({ showShareModal: true })
  },

  closeShareModal() {
    this.setData({ showShareModal: false })
  },

  // 微信分享
  shareWechat() {
    wx.shareFileToMessage({
      filePath: this.data.resultImage,
      success: () => {
        this.setData({ showShareModal: false })
      },
      fail: () => {
        wx.showToast({ title: '分享失败', icon: 'none' })
      }
    })
  },

  // 微博分享
  shareWeibo() {
    wx.showToast({ title: '请截图分享到微博', icon: 'none' })
    this.setData({ showShareModal: false })
  },

  // QQ分享
  shareQQ() {
    wx.showToast({ title: '请截图分享到QQ', icon: 'none' })
    this.setData({ showShareModal: false })
  },

  // 生成海报
  generatePoster() {
    wx.showLoading({ title: '生成中...' })
    
    // 实际项目中这里需要用canvas生成海报
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '海报已生成', icon: 'success' })
      this.setData({ showShareModal: false })
    }, 1500)
  },

  // 分享朋友圈
  shareToMoments() {
    wx.showModal({
      title: '分享到朋友圈',
      content: '请长按图片保存后，打开朋友圈发布',
      confirmText: '我知道了',
      showCancel: false
    })
  },

  // 再试一套
  tryAgain() {
    wx.navigateBack({
      delta: 1,
      fail: () => wx.navigateTo({ url: '/pages/select-style/select-style' })
    })
  },

  // 尝试推荐
  trySuggestion(e) {
    const item = e.currentTarget.dataset.item
    wx.navigateTo({
      url: `/pages/select-style/select-style?recommend=${item.id}`
    })
  },

  // 重新开始
  startOver() {
    // 清理全局数据
    app.globalData.uploadedImage = null
    app.globalData.selectedStyle = null
    app.globalData.selectedNation = null
    app.globalData.resultImage = null
    
    wx.reLaunch({ url: '/pages/index/index' })
  },

  // 返回首页
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
