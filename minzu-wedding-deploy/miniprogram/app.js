// app.js
App({
  globalData: {
    userInfo: null,
    // 上传的原始图片
    uploadedImage: null,
    // 换装模式: 'single' | 'couple'
    dressMode: 'single',
    // 选中的风格
    selectedStyle: null,
    // 换装结果图
    resultImage: null,
    // 后端服务地址（替换为你的实际地址）
    serverUrl: 'https://your-server.com/api'
  },

  onLaunch() {
    // 检查更新
    const updateManager = wx.getUpdateManager()
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启应用？',
        success(res) {
          if (res.confirm) updateManager.applyUpdate()
        }
      })
    })
  }
})
