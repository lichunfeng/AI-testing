# 民族婚礼换装馆 - 微信小程序

> 🎎 56个民族婚礼传统服饰 + 3种婚礼主题风格的 AI 换装小程序

## 功能特性

- ✅ **56个民族婚礼服饰**：汉、藏、蒙、维、苗、壮、满等56个民族各具特色的婚礼盛装
- ✅ **3种婚礼主题风格**：森系风、极简风、童话风
- ✅ **单人换装**：为照片中的主角换上精美民族服饰
- ✅ **合照换装**：为男女双方搭配民族婚礼服饰（新郎新娘风格搭配）
- ✅ **保存分享**：换装后可保存到相册、分享给好友或发朋友圈

## AI 换装服务

**已集成 Replicate IDM-VTON**，目前开源最好的虚拟换装模型。

| 特性 | 说明 |
|------|------|
| **模型** | IDM-VTON (Improving Diffusion Models for Authentic Virtual Try-on) |
| **效果** | ⭐⭐⭐⭐⭐ 接近商业级 |
| **速度** | 10-30秒/张 |
| **成本** | 约 $0.02-0.05/张 |

## 快速开始

### 1. 注册 Replicate 获取 API Token

1. 访问 https://replicate.com/
2. 用 GitHub 或 Google 账号登录
3. 进入 **Account Settings** → **API Tokens**
4. 复制你的 Token（格式：`r8_xxxxxxxxxxxxxxxx`）

### 2. 安装依赖

```bash
cd minzu-wedding-miniapp
npm install
```

### 3. 配置环境变量

```bash
# 在项目根目录创建 .env 文件
cat > .env << 'EOF'
REPLICATE_API_TOKEN=r8_你的API_Token
PORT=3000
EOF
```

### 4. 准备服饰模板图

**这是换装效果的关键！**

为每个民族准备一套**透明背景 PNG** 服饰图：

```
server/templates/
├── 1-female.png          # 汉族新娘
├── 1-male.png            # 汉族新郎
├── 2-female.png          # 蒙古族新娘
├── 2-male.png            # 蒙古族新郎
├── 3-female.png          # 回族新娘
├── 3-male.png            # 回族新郎
... 共56个民族 × 2 = 112张
```

**模板图规格：**
- 尺寸：1024×1024px
- 格式：PNG（透明背景）
- 内容：正面/半侧面，展示完整服饰
- 命名：`{民族ID}-{gender}.png`

### 5. 启动服务

```bash
# 测试 Replicate 连接
npm run test:replicate

# 启动服务
npm start
```

服务运行在 `http://localhost:3000`

### 6. 微信小程序

1. 下载 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 导入 `miniprogram/` 目录
3. 修改 `miniprogram/app.js` 中的 `serverUrl`：

```javascript
// app.js
globalData: {
  serverUrl: 'https://your-server.com/api'  // 替换为你的服务器地址
}
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/upload` | POST | 上传图片 |
| `/api/dress` | POST | **AI换装**（Replicate） |
| `/api/nations` | GET | 获取56民族列表 |
| `/api/themes` | GET | 获取主题风格列表 |

### 换装接口示例

```bash
curl -X POST http://localhost:3000/api/dress \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "http://localhost:3000/uploads/test.jpg",
    "mode": "single",
    "dressType": "nation_1",
    "dressName": "汉族"
  }'
```

**响应：**
```json
{
  "success": true,
  "resultImage": "https://replicate.delivery/.../output.jpg",
  "dressType": "nation_1",
  "dressName": "汉族",
  "duration": 15000
}
```

## 模板图制作指南

### 方案一：淘宝定制（最快）

搜索「民族服饰PNG透明底 定制」，提供：
- 56个民族名称列表
- 要求：1024×1024px，透明背景PNG
- 预算：¥500-1500

### 方案二：AI生成 + 抠图

用 Stable Diffusion 生成，再用 [Pixian.AI](https://pixian.ai/) 抠图：

```
Prompt: "traditional Chinese Han wedding dress, phoenix crown, 
red silk embroidery, transparent background, high quality, PNG"
```

### 方案三：网络素材 + 抠图

从以下网站找素材后抠图：
- [觅元素](https://www.51yuansu.com/)
- [千图网](https://www.58pic.com/)
- [花瓣网](https://huaban.com/)

## 项目结构

```
minzu-wedding-miniapp/
├── miniprogram/              # 微信小程序前端
│   ├── pages/
│   │   ├── index/            # 首页
│   │   ├── upload/           # 上传照片
│   │   ├── select-style/     # 选择服饰
│   │   └── result/          # 结果展示
│   └── app.js
├── server/
│   ├── server.js             # Express 主服务
│   ├── services/
│   │   ├── replicate-service.js  # Replicate AI换装
│   │   └── aliyun-service.js     # 备选：阿里云
│   └── data/
│       ├── nations.json     # 56民族数据
│       └── themes.json      # 3主题数据
├── templates/                 # 服饰模板图（需准备）
├── uploads/                  # 上传文件
├── .env                      # 环境变量
└── package.json
```

## 常见问题

**Q: 没有模板图怎么办？**
A: 先用几张测试，效果OK后再找美工定制全套。

**Q: Replicate 调用失败？**
A: 检查 API Token 是否有效，账户是否有余额。

**Q: 换装效果不自然？**
A: 模板图质量是关键，确保：
- 透明背景干净
- 服饰角度与人物匹配
- 光线风格一致

**Q: 想要更好的效果？**
A: IDM-VTON 已经是目前开源最好的，如需商业级可考虑：
- 训练专属 LoRA
- 使用商业 API（如 ZMO.ai）

## License

MIT License
