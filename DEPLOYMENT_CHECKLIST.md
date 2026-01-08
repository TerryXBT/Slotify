# 🚀 Slotify Vercel 部署检查清单

按照此清单逐步完成部署，确保不遗漏任何步骤。

---

## 📋 部署前准备

### ✅ 步骤 1: 提交代码更改

当前有以下文件需要提交：
- [x] `.env.example` - 已更新 Sentry 变量
- [x] `next.config.mjs` - 已添加 Sentry 和 CSP
- [x] `package.json` & `package-lock.json` - 已添加 Sentry 依赖
- [x] 新增配置文件（vercel.json, sentry.*.config.ts）

**执行命令**:
```bash
cd /Users/terry/Downloads/App_develop/Slotify

# 查看所有更改
git status

# 添加所有新文件和修改
git add .

# 提交更改
git commit -m "Add Vercel deployment and Sentry monitoring configuration

- Add vercel.json for deployment settings
- Integrate Sentry error monitoring (client, server, edge)
- Add Content Security Policy to next.config.mjs
- Update environment variables documentation
- Fix TypeScript errors in booking.ts and audit.ts
- Add deployment guide and setup documentation
"

# 查看提交历史
git log -1
```

---

## 🔑 步骤 2: 准备 Sentry 账号（免费）

### 2.1 注册 Sentry

1. **访问**: https://sentry.io/signup/
2. **选择**: "Sign up with GitHub"（推荐）或邮箱注册
3. **选择计划**: Developer (Free) - 5,000 errors/月
4. **创建组织**: 输入组织名称（例如: `slotify` 或您的名字）

### 2.2 创建项目

1. 点击 "Create Project"
2. **选择平台**: Next.js
3. **项目名称**: `slotify`
4. **Alert frequency**: Default
5. 点击 "Create Project"

### 2.3 获取配置信息

创建项目后，您会看到：

1. **DSN (Data Source Name)**
   ```
   格式: https://[PUBLIC_KEY]@o[ORG_ID].ingest.sentry.io/[PROJECT_ID]
   示例: https://abc123def456@o789012.ingest.sentry.io/345678
   ```

   📝 **记录**: `NEXT_PUBLIC_SENTRY_DSN=_________________`

2. **组织 Slug**
   - 在 URL 中: `https://sentry.io/organizations/YOUR-ORG-SLUG/`

   📝 **记录**: `SENTRY_ORG=_________________`

3. **项目名称**

   📝 **记录**: `SENTRY_PROJECT=slotify`

### 2.4 创建 Auth Token

1. 点击左侧菜单 "Settings"
2. 选择 "Developer Settings"
3. 点击 "Auth Tokens"
4. 点击 "Create New Token"
5. **Token name**: `vercel-deployment`
6. **Scopes** (权限选择):
   - ✅ `project:read`
   - ✅ `project:releases`
   - ✅ `project:write`
   - ✅ `org:read`
7. 点击 "Create Token"
8. **复制 Token**（只显示一次！）

📝 **记录**: `SENTRY_AUTH_TOKEN=sntrys_____________________`

### 2.5 完成记录

请将以下信息保存到安全的地方（例如密码管理器）:

```bash
# Sentry 配置 - 请填写您的值
NEXT_PUBLIC_SENTRY_DSN=https://___________________________
SENTRY_ORG=___________________________
SENTRY_PROJECT=slotify
SENTRY_AUTH_TOKEN=sntrys___________________________
```

---

## 🐙 步骤 3: 推送代码到 GitHub

### 3.1 确认远程仓库

```bash
# 查看远程仓库
git remote -v

# 如果输出类似:
# origin  https://github.com/YOUR_USERNAME/slotify.git (fetch)
# origin  https://github.com/YOUR_USERNAME/slotify.git (push)
# 说明已配置好，继续下一步
```

### 3.2 推送到当前分支

```bash
# 推送当前分支
git push origin feature/dashboard-refactor-and-hardening

# 或者如果您想合并到 main 分支:
# git checkout main
# git merge feature/dashboard-refactor-and-hardening
# git push origin main
```

**问题**: 如果您还没有 GitHub 仓库，请执行:

```bash
# 在 GitHub 创建新仓库后
git remote add origin https://github.com/YOUR_USERNAME/slotify.git
git push -u origin main
```

---

## ☁️ 步骤 4: 在 Vercel 创建项目

### 4.1 访问 Vercel

1. **访问**: https://vercel.com/login
2. **登录**: 使用 GitHub 账号登录（推荐）

### 4.2 导入项目

1. 点击 "Add New..." → "Project"
2. 在 "Import Git Repository" 中找到您的 `slotify` 仓库
3. 点击 "Import"

### 4.3 项目配置

1. **Project Name**: `slotify`（或您喜欢的名称）
2. **Framework Preset**: Next.js（应该自动检测）
3. **Root Directory**: `.` (默认)
4. **Build Command**: `npm run build`（默认）
5. **Output Directory**: `.next`（默认）

**暂时不要点击 "Deploy"！先配置环境变量。**

---

## 🔐 步骤 5: 配置 Vercel 环境变量

在 Vercel 项目配置页面，展开 "Environment Variables" 部分。

### 5.1 必需的环境变量

逐个添加以下变量：

#### Supabase 配置
```
Name:  NEXT_PUBLIC_SUPABASE_URL
Value: https://your-project.supabase.co
```

```
Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: 您的 Supabase Anon Key
```

```
Name:  SUPABASE_SERVICE_ROLE_KEY
Value: 您的 Supabase Service Role Key
```

#### 应用配置
```
Name:  NEXT_PUBLIC_APP_URL
Value: https://slotify.vercel.app
（使用 Vercel 自动生成的 URL，或您的自定义域名）
```

```
Name:  CRON_SECRET
Value: （生成一个随机字符串）
```

**生成 CRON_SECRET**:
```bash
# 在终端运行以下命令生成随机密钥:
openssl rand -base64 32

# 或者在浏览器控制台运行:
# btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
```

#### Sentry 配置（使用步骤 2 记录的值）
```
Name:  NEXT_PUBLIC_SENTRY_DSN
Value: https://abc@o123.ingest.sentry.io/456
```

```
Name:  SENTRY_ORG
Value: your-org-slug
```

```
Name:  SENTRY_PROJECT
Value: slotify
```

```
Name:  SENTRY_AUTH_TOKEN
Value: sntrys_your_token_here
```

#### 邮件服务配置（可选）

**选项 A - Resend（推荐）**:
```
Name:  RESEND_API_KEY
Value: re_xxxxxxxxxxxx
```

```
Name:  RESEND_FROM_EMAIL
Value: noreply@yourdomain.com
```

**选项 B - SMTP**:
```
Name:  SMTP_HOST
Value: smtp.gmail.com
```

```
Name:  SMTP_PORT
Value: 587
```

```
Name:  SMTP_USER
Value: your-email@gmail.com
```

```
Name:  SMTP_PASS
Value: your-app-password
```

```
Name:  SMTP_FROM_EMAIL
Value: noreply@yourdomain.com
```

```
Name:  USE_SMTP
Value: true
```

### 5.2 确认所有变量

**核心变量检查清单**:
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] NEXT_PUBLIC_APP_URL
- [ ] CRON_SECRET
- [ ] NEXT_PUBLIC_SENTRY_DSN
- [ ] SENTRY_ORG
- [ ] SENTRY_PROJECT
- [ ] SENTRY_AUTH_TOKEN
- [ ] 邮件服务配置（Resend 或 SMTP）

---

## 🚀 步骤 6: 部署！

1. 确认所有环境变量已配置
2. 点击 "Deploy" 按钮
3. 等待构建完成（约 2-5 分钟）

### 6.1 观察构建过程

您会看到：
- ✅ Building...
- ✅ Running TypeScript...
- ✅ Collecting page data...
- ✅ Generating static pages...
- ✅ Finalizing page optimization...

**如果构建失败**:
- 检查构建日志中的错误
- 确认所有环境变量正确设置
- 确认代码在本地能成功 `npm run build`

---

## ✅ 步骤 7: 验证部署

### 7.1 访问应用

1. 构建成功后，Vercel 会显示您的应用 URL
2. 点击 URL 访问应用
3. 您应该能看到 Slotify 的登录/注册页面

### 7.2 测试核心功能

**基础测试**:
- [ ] 页面加载正常
- [ ] 注册新账号
- [ ] 登录成功
- [ ] 访问仪表板

**功能测试**:
- [ ] 创建服务
- [ ] 设置可用时间
- [ ] 创建测试预约
- [ ] 检查邮件是否发送

### 7.3 检查 Sentry

1. 访问 Sentry 控制台: https://sentry.io
2. 选择您的项目
3. 几分钟后应该能看到:
   - ✅ 第一个事件（可能是部署通知）
   - ✅ 性能数据（Transactions）

**测试错误监控**:
暂时在代码中触发一个测试错误:
```typescript
// 在任意页面添加
throw new Error('Sentry test error')
```
然后访问该页面，检查 Sentry 是否捕获到错误。

### 7.4 更新 APP_URL（重要！）

部署成功后：

1. 前往 Vercel 项目 Settings → Environment Variables
2. 找到 `NEXT_PUBLIC_APP_URL`
3. 更新为实际的 Vercel URL（例如: `https://slotify-abc123.vercel.app`）
4. 点击 "Save"
5. 前往 Deployments 标签
6. 找到最新部署，点击 "..." → "Redeploy"
7. 选择 "Redeploy with existing Build Cache"

---

## 📊 步骤 8: 配置 Cron 任务（提醒功能）

### 免费方案 - 使用 cron-job.org

由于 Vercel Cron 需要 Pro 计划（$20/月），我们使用免费替代方案：

1. **访问**: https://cron-job.org/en/signup/
2. **注册免费账号**
3. **创建新任务**:
   - Title: `Slotify Daily Reminders`
   - URL: `https://your-app.vercel.app/api/cron/reminders?secret=YOUR_CRON_SECRET`
   - Schedule: 每天 9:00 AM（选择您的时区）
   - 启用 "Notifications on failure"
4. **测试**: 点击 "Test" 按钮确认 URL 可访问

### 或使用 Vercel Pro 计划

如果您升级到 Vercel Pro:
- Cron 任务会自动从 `vercel.json` 配置启用
- 无需额外设置

---

## 🎉 部署完成！

### 您现在拥有：

✅ **远程部署** - 应用运行在 Vercel 云端
✅ **外部访问** - 任何人都可以通过 URL 访问
✅ **错误监控** - Sentry 实时追踪所有错误
✅ **自动部署** - 每次 git push 都会自动部署
✅ **HTTPS** - 自动获得 SSL 证书
✅ **零成本** - 完全使用免费计划

### 下一步建议：

1. **配置自定义域名**（可选）
   - Vercel Settings → Domains
   - 添加您的域名
   - 配置 DNS 记录

2. **添加 Upstash Redis**（生产级限流）
   - 参考 TODO_PRODUCTION_READY.md 的步骤 3

3. **邀请 Beta 用户测试**
   - 分享您的 URL
   - 收集反馈

---

## 🐛 常见问题

### 构建失败

**问题**: "Build failed" 错误
**解决**:
1. 检查构建日志中的具体错误
2. 确认本地 `npm run build` 能成功
3. 验证所有环境变量正确设置
4. 检查 Node.js 版本（Vercel 默认使用 Node 20）

### Sentry 没有数据

**问题**: Sentry 控制台没有显示任何事件
**解决**:
1. 确认 `NEXT_PUBLIC_SENTRY_DSN` 正确设置
2. 检查变量名称以 `NEXT_PUBLIC_` 开头
3. 重新部署应用
4. 访问应用触发一些页面加载
5. 等待 5-10 分钟数据同步

### 邮件发送失败

**问题**: 预约确认邮件没有收到
**解决**:
1. 检查 Vercel Functions 日志
2. 验证邮件服务配置（Resend 或 SMTP）
3. 检查 Sentry 是否捕获到邮件错误
4. 测试邮件服务 API key 是否有效

### Cron 任务不工作

**问题**: 每日提醒没有发送
**解决**:
1. 如使用 cron-job.org，检查任务历史
2. 验证 `CRON_SECRET` 与 URL 中的一致
3. 手动访问 Cron URL 测试
4. 检查 Vercel Functions 日志

---

## 📞 需要帮助？

- **Vercel 文档**: https://vercel.com/docs
- **Sentry 文档**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Supabase 文档**: https://supabase.com/docs

---

**准备好了吗？开始部署！🚀**
