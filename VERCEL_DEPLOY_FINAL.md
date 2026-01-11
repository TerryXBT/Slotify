# 🚀 Vercel 最终部署指南

**您的所有配置已准备好！**

---

## ✅ 已完成的准备工作

1. ✅ 代码已推送到 GitHub
2. ✅ Sentry 配置完成
3. ✅ Supabase 云端配置已获取
4. ✅ Gmail SMTP 配置已准备
5. ⏳ 数据库结构需要推送（参考 DEPLOY_DATABASE.md）

---

## 📋 完整的 13 个环境变量

### 复制以下配置到 Vercel：

```bash
# ============================================
# 1. SUPABASE 配置（3个）✅
# ============================================

NEXT_PUBLIC_SUPABASE_URL
https://oqocvwpojhuzxyksousv.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xb2N2d3Bvamh1enh5a3NvdXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMDE0NjAsImV4cCI6MjA4MzY3NzQ2MH0.L6kd4TYZAn8XHknJ4fHtkAko9nTW2ukgOLJnZ2OLMD4

SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xb2N2d3Bvamh1enh5a3NvdXN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODEwMTQ2MCwiZXhwIjoyMDgzNjc3NDYwfQ.ddz-n3X83Vd0qk3gW4L26ksGPOofRxoMa347OiuK_ZE

# ============================================
# 2. 应用配置（2个）✅
# ============================================

NEXT_PUBLIC_APP_URL
https://slotify.vercel.app

CRON_SECRET
somrOXlcl+hr7amhUvOhdpyKddBT66i1pd9wmEmKd7A=

# ============================================
# 3. SENTRY 配置（4个）✅
# ============================================

NEXT_PUBLIC_SENTRY_DSN
https://585031005b7e3d7efaf78d1790171ccc@o4510677488041984.ingest.us.sentry.io/4510677505015808

SENTRY_ORG
slotify

SENTRY_PROJECT
slotify

SENTRY_AUTH_TOKEN
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

# ============================================
# 4. GMAIL SMTP 配置（4个）✅
# ============================================

USE_SMTP
true

SMTP_HOST
smtp.gmail.com

SMTP_PORT
587

SMTP_USER
tche1230@gmail.com

SMTP_PASS
qngamiziirtcqlfe

SMTP_FROM_EMAIL
tche1230@gmail.com
```

---

## 🚀 Vercel 部署步骤

### 步骤 1：访问 Vercel

打开：**https://vercel.com/login**

点击：**Continue with GitHub**

### 步骤 2：导入项目

1. 点击右上角 **"Add New..."** → **"Project"**
2. 在列表中找到 **"Slotify"** 仓库
3. 点击 **"Import"**

### 步骤 3：配置项目

**保持默认设置**：
- Project Name: `slotify`
- Framework Preset: Next.js
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: `.next`

**⚠️ 不要点击 "Deploy"！先配置环境变量**

### 步骤 4：添加环境变量

1. **展开** "Environment Variables" 部分

2. **逐个添加 13 个变量**：

   **方法 A：手动添加**（推荐）
   - 在 Name 框输入变量名
   - 在 Value 框粘贴对应的值
   - 点击 "Add"
   - 重复 13 次

   **方法 B：批量粘贴**
   - 点击 "Bulk Edit"
   - 将上面的所有变量复制粘贴
   - 格式：`NAME=value`（每行一个）

3. **确认检查清单**：
   - [ ] NEXT_PUBLIC_SUPABASE_URL
   - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
   - [ ] SUPABASE_SERVICE_ROLE_KEY
   - [ ] NEXT_PUBLIC_APP_URL
   - [ ] CRON_SECRET
   - [ ] NEXT_PUBLIC_SENTRY_DSN
   - [ ] SENTRY_ORG
   - [ ] SENTRY_PROJECT
   - [ ] SENTRY_AUTH_TOKEN
   - [ ] USE_SMTP
   - [ ] SMTP_HOST
   - [ ] SMTP_PORT
   - [ ] SMTP_USER
   - [ ] SMTP_PASS
   - [ ] SMTP_FROM_EMAIL

### 步骤 5：部署！

1. **点击** "Deploy" 按钮
2. **等待** 构建完成（2-5 分钟）
3. **观察** 构建日志

**成功标志**：
- ✅ 看到 "Congratulations!" 页面
- ✅ 显示应用 URL

**如果失败**：
- 查看构建日志错误
- 检查环境变量是否正确

### 步骤 6：部署后配置

**A. 复制实际 URL**
- Vercel 会显示类似：`https://slotify-abc123.vercel.app`
- 复制这个 URL

**B. 更新 APP_URL**
1. 在 Vercel 项目中，点击 **"Settings"**
2. 点击 **"Environment Variables"**
3. 找到 `NEXT_PUBLIC_APP_URL`
4. 点击右侧 **"..."** → **"Edit"**
5. 更新为实际的 URL
6. 点击 **"Save"**

**C. 重新部署**
1. 点击顶部 **"Deployments"** 标签
2. 找到最新部署
3. 点击 **"..."** → **"Redeploy"**
4. 选择 **"Redeploy with existing Build Cache"**
5. 等待完成

---

## ✅ 验证部署

### 1. 访问应用
打开您的 Vercel URL

### 2. 测试功能
- [ ] 页面加载正常
- [ ] 可以注册新账号
- [ ] 可以登录
- [ ] 可以访问仪表板
- [ ] 可以创建服务
- [ ] 可以创建预约

### 3. 检查 Sentry
- 访问 https://sentry.io
- 查看 slotify 项目
- 应该能看到事件记录

### 4. 检查邮件
- 注册时应该收到邮件
- 预约时应该收到确认邮件

---

## 🎉 完成！

您的 Slotify 应用现在：
- ✅ 部署在 Vercel 云端
- ✅ 使用云端 Supabase 数据库
- ✅ Sentry 实时监控
- ✅ Gmail SMTP 发送邮件
- ✅ HTTPS 自动加密
- ✅ 外部可访问
- ✅ 完全免费运行

---

## 📱 分享您的应用

您的应用 URL：`https://slotify-[your-id].vercel.app`

可以立即分享给他人使用！

---

## 🔄 后续更新

每次代码更改后：
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel 会自动重新部署。

---

## 💰 成本确认

**月度成本**: $0

- Vercel Hobby: $0
- Supabase Free: $0
- Sentry Developer: $0
- Gmail SMTP: $0

---

**准备好了吗？开始部署！🚀**

1. 确认数据库已推送（参考 DEPLOY_DATABASE.md）
2. 打开 https://vercel.com/login
3. 按照上面的步骤操作
4. 10-15 分钟后完成！
