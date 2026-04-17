# 民族婚礼换装馆小程序 - 开发任务记录

## 任务目标
开发微信小程序"民族婚礼换装馆"，支持56个民族婚礼服饰+3种婚礼主题风格的AI换装功能。

## 完成时间
2026-04-17 11:07 GMT+8

## 交付物

### 项目结构
```
minzu-wedding-miniapp/
├── miniprogram/               # 微信小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── project.config.json
│   └── pages/
│       ├── index/            # 首页：模式选择、热门民族/主题展示
│       ├── upload/           # 上传照片页
│       ├── select-style/     # 选择服饰风格页（56民族+3主题分Tab展示）
│       └── result/           # 结果展示+保存分享
└── server/                   # Node.js 后端
    ├── server.js             # Express 主服务，/api/dress 核心换装接口
    ├── services/
    │   ├── aliyun-service.js # 阿里云AI换装完整集成（含人体分割+叠加+OSS）
    │   └── ai-service.js     # 备选：腾讯云/SD方案（保留）
    └── data/
        ├── nations.json      # 完整56个民族数据
        └── themes.json        # 3个婚礼主题数据
```

### 阿里云接入完成度

**已完成的代码：**
- ✅ `aliyun-service.js` 完整阿里云 SDK 集成代码
- ✅ 人体分割 API 调用（SegmentHumanBody）
- ✅ 服饰模板叠加逻辑（含 sharp 图片处理）
- ✅ OSS 模板图管理（上传/获取签名URL）
- ✅ 56个民族的模板文件名映射
- ✅ 连接测试工具 `testConnection()`
- ✅ 升级 `server.js` 启用阿里云服务

**需要用户提供的：**
1. 阿里云 AccessKey（RAM 控制台创建）
2. 开通人体分割服务（人像分割 → 人体分割）
3. 56套民族服饰模板图（112张透明PNG：男+女各56张）
4. OSS Bucket（可选，本地 templates/ 目录也行）

### 关键代码路径

| 文件 | 作用 |
|------|------|
| `server/services/aliyun-service.js` | 阿里云换装核心逻辑 |
| `server/server.js` | HTTP 接口路由，调用 aliyun-service |
| `package.json` | 包含 @alicloud/facebody SDK |
| `.env`（需创建） | 存放 AccessKey 等敏感配置 |

### 快速验证流程

```bash
cd minzu-wedding-miniapp

# 1. 创建 .env 文件，填入 AccessKey
cat > .env << 'EOF'
ALIYUN_ACCESS_KEY=你的ID
ALIYUN_ACCESS_SECRET=你的Secret
EOF

# 2. 安装依赖
npm install

# 3. 测试阿里云连接
npm run test:aliyun

# 4. 启动服务
npm start

# 5. 手动测试换装
curl -X POST http://localhost:3000/api/dress \
  -H "Content-Type: application/json" \
  -d '{"imageUrl":"任意图片URL","mode":"single","dressType":"nation_1","dressName":"汉族"}'
```

### 模板图命名规范

```
server/templates/
  han-male.png / han-female.png
  tibetan-male.png / tibetan-female.png
  mongol-male.png / mongol-female.png
  ...共56个民族 × 2（男女）= 112张
  senlin-male.png / senlin-female.png  # 主题风格
  jijian-male.png / jijian-female.png
  tonghua-male.png / tonghua-female.png
```
