// pages/upload/upload.js
const app = getApp()

Page({
  data: {
    mode: 'single', // 'single' | 'couple'
    uploadedImage: null,
    uploading: false
  },

  onLoad(options) {
    const mode = options.mode || 'single'
    this.setData({ mode })
    app.globalData.dressMode = mode
  },

  // 上传图片
  uploadImage() {
    const that = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success(res) {
        const tempFile = res.tempFiles[0].tempFilePath
        that.setData({ uploadedImage: tempFile })
        app.globalData.uploadedImage = tempFile
      },
      fail(err) {
        console.error('选择图片失败', err)
        if (err.errMsg.indexOf('auth deny') !== -1) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册权限',
            confirmText: '去设置',
            success(res) {
              if (res.confirm) wx.openSetting()
            }
          })
        }
      }
    })
  },

  // 下一步
  nextStep() {
    if (!this.data.uploadedImage) {
      wx.showToast({ title: '请先上传照片', icon: 'none' })
      return
    }
    
    wx.navigateTo({
      url: '/pages/select-style/select-style?mode=' + this.data.mode
    })
  }
})
