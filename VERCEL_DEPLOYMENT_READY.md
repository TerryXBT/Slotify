# 🚀 准备部署到 Vercel

**状态**: ✅ 所有配置已完成，可以开始部署

---

## ✅ 已完成的准备工作

1. ✅ 代码已推送到 GitHub
2. ✅ Sentry 已配置完成
3. ✅ 所有配置信息已准备好

---

## 🎯 现在开始：部署到 Vercel

### 步骤 1：访问 Vercel 并登录

1. 打开浏览器，访问：**https://vercel.com/login**
2. 点击 **"Continue with GitHub"**
3. 授权 Vercel 访问您的 GitHub 账号

---

### 步骤 2：导入项目

1. 登录后，点击右上角 **"Add New..."** → **"Project"**
2. 在 "Import Git Repository" 部分找到 **`Slotify`** 仓库
3. 点击仓库右侧的 **"Import"** 按钮

---

### 步骤 3：配置项目（重要！）

导入后会看到项目配置页面：

**项目设置（保持默认）**:
- Project Name: `slotify` 或您喜欢的名称
- Framework Preset: Next.js（自动检测）
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`

**⚠️ 暂时不要点击 "Deploy"！先配置环境变量**

---

### 步骤 4：配置环境变量（最重要！）

在项目配置页面，展开 **"Environment Variables"** 部分。

#### 必需配置（9个变量）

请逐个添加以下环境变量：

---

#### 1. Supabase 配置（3个）

**变量 1:**
```
Name:  NEXT_PUBLIC_SUPABASE_URL
Value: （从您的 Supabase Dashboard → Settings → API 获取）
```

**变量 2:**
```
Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: （从 Supabase Dashboard → Settings → API → anon public 获取）
```

**变量 3:**
```
Name:  SUPABASE_SERVICE_ROLE_KEY
Value: （从 Supabase Dashboard → Settings → API → service_role secret 获取）
```

---

#### 2. 应用配置（2个）

**变量 4:**
```
Name:  NEXT_PUBLIC_APP_URL
Value: https://slotify.vercel.app
```
（临时值，部署后需要更新为实际 URL）

**变量 5:**
```
Name:  CRON_SECRET
Value: somrOXlcl+hr7amhUvOhdpyKddBT66i1pd9wmEmKd7A=
```

---

#### 3. Sentry 配置（4个）✅ 已准备好

**变量 6:**
```
Name:  NEXT_PUBLIC_SENTRY_DSN
Value: https://585031005b7e3d7efaf78d1790171ccc@o4510677488041984.ingest.us.sentry.io/4510677505015808
```

**变量 7:**
```
Name:  SENTRY_ORG
Value: slotify
```

**变量 8:**
```
Name:  SENTRY_PROJECT
Value: slotify
```

**变量 9:**
```
Name:  SENTRY_AUTH_TOKEN
Value: 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
```

---

#### 4. 邮件服务（可选，推荐配置）

如果您有 Resend 账号：

**变量 10:**
```
Name:  RESEND_API_KEY
Value: re_你的密钥
```

**变量 11:**
```
Name:  RESEND_FROM_EMAIL
Value: noreply@yourdomain.com
```

如果没有邮件服务，可以先跳过，部署后再配置。

---

### 步骤 5：确认并部署

1. **检查清单** - 确认至少配置了 9 个必需变量：
   - [ ] NEXT_PUBLIC_SUPABASE_URL
   - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
   - [ ] SUPABASE_SERVICE_ROLE_KEY
   - [ ] NEXT_PUBLIC_APP_URL
   - [ ] CRON_SECRET
   - [ ] NEXT_PUBLIC_SENTRY_DSN ✅
   - [ ] SENTRY_ORG ✅
   - [ ] SENTRY_PROJECT ✅
   - [ ] SENTRY_AUTH_TOKEN ✅

2. **点击 "Deploy" 按钮**

3. **等待构建完成**（约 2-5 分钟）
   - 您会看到构建进度
   - 如果失败，查看构建日志

---

### 步骤 6：部署成功后

**A. 获取实际 URL**
- Vercel 会显示您的应用 URL
- 格式：`https://slotify-xxxx.vercel.app`
- 复制这个 URL

**B. 更新 APP_URL（重要！）**
1. 在 Vercel 项目中，点击 **"Settings"** → **"Environment Variables"**
2. 找到 `NEXT_PUBLIC_APP_URL`
3. 点击右侧的 **"..."** → **"Edit"**
4. 更新为实际的 Vercel URL
5. 点击 **"Save"**

**C. 重新部署**
1. 点击顶部的 **"Deployments"** 标签
2. 找到最新的部署
3. 点击右侧 **"..."** → **"Redeploy"**
4. 选择 **"Redeploy with existing Build Cache"**
5. 等待重新部署完成

---

### 步骤 7：验证部署

1. **访问应用**：打开您的 Vercel URL
2. **测试功能**：
   - [ ] 页面加载正常
   - [ ] 可以注册新账号
   - [ ] 可以登录
   - [ ] 可以访问仪表板

3. **检查 Sentry**：
   - 访问 https://sentry.io
   - 选择 slotify 项目
   - 几分钟后应该能看到事件

---

## 🎉 部署完成！

您的应用现在已经：
- ✅ 部署在 Vercel 云端
- ✅ 可以通过公开 URL 访问
- ✅ Sentry 实时监控错误
- ✅ 自动 HTTPS 加密
- ✅ 完全免费运行

---

## 📝 部署后的下一步

### 可选配置：

1. **自定义域名**
   - Vercel Settings → Domains
   - 添加您的域名

2. **Cron 任务**（提醒功能）
   - 免费方案：使用 cron-job.org
   - 付费方案：Vercel Pro 自动启用

3. **添加 Upstash Redis**（生产级限流）
   - 参考 TODO_PRODUCTION_READY.md

4. **邀请用户测试**
   - 分享您的 URL
   - 收集反馈

---

## 🐛 遇到问题？

### 构建失败
- 查看 Vercel 构建日志
- 确认所有环境变量正确设置
- 确认本地 `npm run build` 能成功

### 应用报错
- 检查 Sentry 控制台
- 查看 Vercel Functions 日志
- 验证 Supabase 连接

---

**准备好了吗？开始部署！🚀**

1. 打开 https://vercel.com/login
2. 导入 Slotify 项目
3. 配置环境变量
4. 点击 Deploy

**预计时间：10-15 分钟**
