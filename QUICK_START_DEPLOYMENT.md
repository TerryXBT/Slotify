# 🚀 快速部署指南（15 分钟）

这是一个精简版的部署指南，帮助您快速将 Slotify 部署到 Vercel。

---

## 📋 需要准备的账号（全部免费）

1. ✅ GitHub 账号（您已有）
2. ⚪ Sentry 账号（5 分钟注册）→ https://sentry.io/signup/
3. ⚪ Vercel 账号（2 分钟注册）→ https://vercel.com/login

---

## 🔄 步骤 1: 推送代码（1 分钟）

代码已提交，现在推送到 GitHub：

```bash
# 推送到当前分支
git push origin feature/dashboard-refactor-and-hardening

# 或者推送到 main 分支（如果您想从 main 部署）
# git checkout main
# git merge feature/dashboard-refactor-and-hardening
# git push origin main
```

✅ **完成标志**: 在 GitHub 上能看到最新的提交

---

## 🔑 步骤 2: 注册并配置 Sentry（5 分钟）

### 2.1 快速注册
1. 访问 https://sentry.io/signup/
2. 点击 "Sign up with GitHub"
3. 选择 **Developer (Free)** 计划
4. 创建组织（例如：`slotify`）

### 2.2 创建项目
1. 点击 "Create Project"
2. 选择平台: **Next.js**
3. 项目名称: `slotify`
4. 点击 "Create Project"

### 2.3 记录配置信息

**DSN** (创建项目后立即显示):
```
https://[KEY]@o[ORG].ingest.sentry.io/[PROJECT]
```

复制并保存：
```
NEXT_PUBLIC_SENTRY_DSN=___________________________
```

**组织 Slug** (在浏览器 URL 中):
```
https://sentry.io/organizations/YOUR-ORG-SLUG/
```

复制并保存：
```
SENTRY_ORG=___________________________
```

**项目名称**:
```
SENTRY_PROJECT=slotify
```

### 2.4 创建 Auth Token
1. Settings → Developer Settings → Auth Tokens
2. "Create New Token"
3. 名称: `vercel-deployment`
4. 权限: `project:read`, `project:releases`, `project:write`, `org:read`
5. Create Token → **复制 Token**（只显示一次！）

保存：
```
SENTRY_AUTH_TOKEN=sntrys___________________________
```

✅ **完成标志**: 您有 4 个 Sentry 配置值

---

## ☁️ 步骤 3: 部署到 Vercel（8 分钟）

### 3.1 登录 Vercel
1. 访问 https://vercel.com/login
2. 用 GitHub 账号登录

### 3.2 导入项目
1. 点击 "Add New..." → "Project"
2. 找到您的 `slotify` 仓库
3. 点击 "Import"

### 3.3 配置环境变量

**⚠️ 重要: 先不要点 Deploy！**

展开 "Environment Variables"，添加以下变量：

#### 最小必需配置（9 个变量）

```bash
# 1. Supabase URL
NEXT_PUBLIC_SUPABASE_URL
# 值: https://your-project.supabase.co

# 2. Supabase Anon Key
NEXT_PUBLIC_SUPABASE_ANON_KEY
# 值: eyJhbGci... (从 Supabase Dashboard → Settings → API 获取)

# 3. Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY
# 值: eyJhbGci... (从 Supabase Dashboard → Settings → API 获取)

# 4. App URL (先用临时值)
NEXT_PUBLIC_APP_URL
# 值: https://slotify.vercel.app

# 5. Cron Secret (生成随机字符串)
CRON_SECRET
# 值: (运行命令: openssl rand -base64 32)

# 6-9. Sentry 配置（步骤 2 中获取的 4 个值）
NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
```

#### 邮件服务（可选，但推荐）

**选项 A - Resend**（如果有账号）:
```bash
RESEND_API_KEY
RESEND_FROM_EMAIL
```

**选项 B - 跳过邮件配置**:
- 部署后邮件功能会失败，但不影响其他功能
- 稍后可以添加

### 3.4 部署！
1. 确认所有必需变量已添加
2. 点击 **"Deploy"**
3. 等待 2-5 分钟

✅ **完成标志**: 看到 "Congratulations!" 页面

---

## ✅ 步骤 4: 验证部署（2 分钟）

### 4.1 访问应用
点击 Vercel 显示的 URL，您应该能看到 Slotify 登录页面

### 4.2 更新 APP_URL（重要！）
1. 复制实际的 Vercel URL（例如: `https://slotify-abc123.vercel.app`）
2. Vercel 项目 → Settings → Environment Variables
3. 找到 `NEXT_PUBLIC_APP_URL`，点击 Edit
4. 更新为实际 URL → Save
5. Deployments 标签 → 最新部署 → ... → Redeploy

### 4.3 快速测试
- [ ] 注册新账号
- [ ] 登录成功
- [ ] 访问仪表板

### 4.4 检查 Sentry
1. 访问 https://sentry.io
2. 选择 slotify 项目
3. 几分钟后应该能看到事件

---

## 🎉 完成！

您现在有一个运行中的 Slotify 应用：
- ✅ 部署在 Vercel 云端
- ✅ 任何人都可以访问
- ✅ Sentry 监控所有错误
- ✅ 自动 HTTPS
- ✅ 完全免费

---

## 📱 分享您的应用

您的应用 URL:
```
https://slotify-[您的ID].vercel.app
```

可以立即分享给他人测试！

---

## 🔄 后续更新

每次代码更改后：
```bash
git add .
git commit -m "Your changes"
git push origin main  # 或您的部署分支
```

Vercel 会自动检测并重新部署。

---

## ⚙️ 可选：配置 Cron 任务（提醒功能）

Vercel Cron 需要 Pro 计划（$20/月）。免费替代方案：

1. 访问 https://cron-job.org/en/signup/
2. 注册免费账号
3. 创建任务:
   - URL: `https://your-app.vercel.app/api/cron/reminders?secret=YOUR_CRON_SECRET`
   - 时间: 每天 9:00 AM
   - 时区: 您的时区

---

## 🐛 遇到问题？

### 构建失败
- 查看 Vercel 构建日志
- 确认所有环境变量正确
- 确认本地 `npm run build` 成功

### Sentry 无数据
- 等待 5-10 分钟
- 确认 DSN 以 `NEXT_PUBLIC_` 开头
- 访问几个页面触发事件

### 更详细的指南
查看完整文档:
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 详细检查清单
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - 完整部署指南

---

## 💰 成本

当前配置：**$0/月** ✅

- Vercel Hobby: $0
- Sentry Developer: $0
- Supabase Free: $0

当用户增长后可按需升级。

---

**准备好了吗？开始吧！🚀**

从步骤 1 开始：推送代码到 GitHub
