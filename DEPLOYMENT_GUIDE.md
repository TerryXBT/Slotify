# Slotify 部署指南

本指南将帮助您将 Slotify 部署到 Vercel，实现远程访问和外部访问。

## 📋 前置要求

- [x] GitHub 账号
- [x] Vercel 账号（免费）https://vercel.com
- [x] Sentry 账号（免费）https://sentry.io
- [x] Supabase 项目
- [x] Resend 账号（可选，用于邮件发送）

---

## 🚀 部署步骤

### 步骤 1: 准备 Sentry（免费错误监控）

1. **注册 Sentry 账号**
   - 访问 https://sentry.io
   - 选择 **免费 Developer 计划**（5K errors/月）
   - 创建新组织

2. **创建项目**
   - 点击 "Create Project"
   - 选择平台: **Next.js**
   - 项目名称: `slotify`
   - 点击 "Create Project"

3. **获取配置信息**
   - 复制 **DSN** (类似: `https://abc123@o456.ingest.sentry.io/789`)
   - 前往 **Settings** → **Developer Settings** → **Auth Tokens**
   - 创建新 token，权限选择: `project:releases`, `project:write`
   - 复制 Auth Token

4. **记录以下信息**（稍后需要）:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://abc123@o456.ingest.sentry.io/789
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=slotify
   SENTRY_AUTH_TOKEN=sntrys_abc123...
   ```

---

### 步骤 2: 将代码推送到 GitHub

1. **初始化 Git 仓库**（如果还没有）
   ```bash
   cd /Users/terry/Downloads/App_develop/Slotify
   git init
   git add .
   git commit -m "Initial commit with Vercel and Sentry configuration"
   ```

2. **创建 GitHub 仓库**
   - 访问 https://github.com/new
   - 仓库名称: `slotify`
   - 选择 **Private**（推荐）
   - 不要初始化 README
   - 点击 "Create repository"

3. **推送代码**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/slotify.git
   git branch -M main
   git push -u origin main
   ```

---

### 步骤 3: 部署到 Vercel（免费托管）

1. **导入项目**
   - 访问 https://vercel.com/new
   - 选择 "Import Git Repository"
   - 授权访问 GitHub
   - 选择 `slotify` 仓库
   - 点击 "Import"

2. **配置环境变量**

   在 "Environment Variables" 部分，添加以下变量：

   **必需变量（Supabase）**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   **必需变量（应用配置）**:
   ```
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   CRON_SECRET=生成一个随机字符串（建议32位）
   ```

   生成 CRON_SECRET:
   ```bash
   openssl rand -base64 32
   ```

   **必需变量（Sentry 监控）**:
   ```
   NEXT_PUBLIC_SENTRY_DSN=你的Sentry DSN
   SENTRY_ORG=你的组织slug
   SENTRY_PROJECT=slotify
   SENTRY_AUTH_TOKEN=你的Sentry Auth Token
   ```

   **可选变量（邮件服务）**:

   选项 A - 使用 Resend（推荐）:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

   选项 B - 使用 SMTP:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   USE_SMTP=true
   ```

3. **部署**
   - 点击 "Deploy"
   - 等待构建完成（约 2-3 分钟）
   - 部署成功后，您会得到一个 URL: `https://slotify-xxx.vercel.app`

4. **更新 APP_URL**
   - 前往 Vercel 项目设置
   - Settings → Environment Variables
   - 编辑 `NEXT_PUBLIC_APP_URL`
   - 改为您的实际 Vercel URL
   - 点击 "Save"
   - 触发重新部署: Deployments → 最新部署 → ... → Redeploy

---

### 步骤 4: 配置 Vercel Cron 任务（提醒功能）

⚠️ **注意**: Cron 任务需要 **Vercel Pro 计划**（$20/月）

如果您使用免费计划，可以暂时跳过此步骤，或使用外部 Cron 服务：

**替代方案 - 使用 cron-job.org（免费）**:
1. 访问 https://cron-job.org
2. 注册免费账号
3. 创建新任务:
   - URL: `https://your-app.vercel.app/api/cron/reminders?secret=YOUR_CRON_SECRET`
   - 时间: 每天 9:00 AM
   - 时区: 选择您的时区

---

### 步骤 5: 验证部署

1. **检查应用**
   - 访问您的 Vercel URL
   - 注册一个测试账号
   - 创建一个测试预约

2. **检查 Sentry**
   - 前往 Sentry 控制台
   - 查看是否收到事件（可能需要几分钟）

3. **检查健康状态**（稍后我们会添加这个端点）
   - 访问 `https://your-app.vercel.app/api/health`

---

## 🔒 安全检查清单

部署后请确认：

- [ ] 所有敏感环境变量已设置（不要硬编码）
- [ ] `.env` 文件在 `.gitignore` 中（不要提交到 Git）
- [ ] CRON_SECRET 已生成并设置
- [ ] Sentry DSN 已设置并正常工作
- [ ] Supabase RLS 策略已启用
- [ ] Vercel 项目设置为 Private（如果包含敏感业务逻辑）

---

## 💰 成本估算

### 免费方案（推荐起步）

| 服务 | 计划 | 成本 | 限制 |
|------|------|------|------|
| **Vercel** | Hobby | $0/月 | 100GB 带宽，无商业使用 |
| **Sentry** | Developer | $0/月 | 5K errors/月 |
| **Supabase** | Free | $0/月 | 500MB 数据库，50K 月活用户 |
| **Resend** | Free | $0/月 | 100 邮件/天 |
| **Upstash** | Free | $0/月 | 10K 命令/天（下一步添加）|
| **总计** | | **$0/月** | 适合 MVP/Beta 测试 |

### 付费方案（生产环境）

| 服务 | 计划 | 成本 | 特性 |
|------|------|------|------|
| **Vercel** | Pro | $20/月 | Cron 任务，无限带宽，商业使用 |
| **Sentry** | Team | $26/月 | 50K errors/月，更多功能 |
| **Supabase** | Pro | $25/月 | PITR 备份，更高性能 |
| **Resend** | Pro | $20/月 | 50K 邮件/月 |
| **Upstash** | Pay as you go | $5-10/月 | 按使用量计费 |
| **总计** | | **$96-101/月** | 适合生产环境 |

---

## 🔄 自动部署

配置完成后，每次推送到 `main` 分支都会自动部署：

```bash
# 修改代码后
git add .
git commit -m "Your commit message"
git push origin main

# Vercel 会自动检测并部署
```

---

## 🐛 故障排查

### 构建失败

**问题**: Build 时出错
**解决**:
1. 检查所有环境变量是否设置正确
2. 查看 Vercel 构建日志
3. 本地运行 `npm run build` 测试

### Sentry 没有收到错误

**问题**: Sentry 控制台没有事件
**解决**:
1. 确认 `NEXT_PUBLIC_SENTRY_DSN` 已设置
2. 检查环境变量是否以 `NEXT_PUBLIC_` 开头（客户端可见）
3. 触发一个测试错误（在页面中 `throw new Error('Test')`）

### Cron 任务不工作

**问题**: 提醒邮件没有发送
**解决**:
1. 确认您使用的是 Vercel Pro 计划，或使用了外部 Cron 服务
2. 检查 `CRON_SECRET` 是否匹配
3. 手动访问 Cron URL 测试

### 邮件发送失败

**问题**: 预约确认邮件没有收到
**解决**:
1. 检查邮件服务配置（Resend 或 SMTP）
2. 查看 Vercel Functions 日志
3. 检查 Sentry 是否捕获到错误

---

## 📊 监控和维护

部署后建议监控以下指标：

1. **Vercel 控制台**
   - 构建状态
   - 函数执行时间
   - 带宽使用

2. **Sentry 控制台**
   - 错误率
   - 性能指标
   - 用户影响

3. **Supabase 控制台**
   - 数据库大小
   - API 请求量
   - 活跃用户数

---

## 🎉 下一步

部署完成后，您可以：

1. ✅ **配置自定义域名**
   - Vercel Settings → Domains
   - 添加您的域名
   - 配置 DNS 记录

2. ✅ **添加 Upstash Redis**（生产级限流）
   - 参考下一个配置指南

3. ✅ **设置 CI/CD**（自动化测试）
   - GitHub Actions 配置

4. ✅ **邀请 Beta 用户测试**

---

## 📞 需要帮助？

如有问题，请查看：
- [Vercel 文档](https://vercel.com/docs)
- [Sentry Next.js 文档](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Supabase 文档](https://supabase.com/docs)

---

**部署愉快！🚀**
