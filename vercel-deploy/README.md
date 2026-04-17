# 民族婚礼换装馆 - API 服务

## 部署到 Vercel

1. Fork 或上传此仓库到 GitHub
2. 在 Vercel 中导入项目
3. 添加环境变量：
   - `REPLICATE_API_TOKEN`: 你的 Replicate API Token
4. Deploy！

## API 接口

### POST /api/dress
换装接口

```json
{
  "imageUrl": "图片URL",
  "dressType": "nation_1",
  "dressName": "汉族"
}
```

### POST /api/upload
上传图片到 Replicate
