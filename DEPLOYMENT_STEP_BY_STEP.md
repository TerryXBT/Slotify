# 🚀 Slotify Vercel 部署 - 详细步骤指导

**基于您的配置**: 本地 Supabase + Gmail SMTP

---

## ⚠️ 重要发现

您目前使用的是**本地 Supabase**（`127.0.0.1:54321`），这只能在您的电脑上工作。

要部署到 Vercel，您需要：
- **创建云端 Supabase 项目**，或
- **使用现有的云端 Supabase 项目**

---

## 📋 选择您的方案

### 方案 A：创建新的云端 Supabase 项目（推荐）

**优点**：
- ✅ 独立的生产环境
- ✅ 不影响本地开发
- ✅ 免费 500MB 数据库

**时间**：约 10 分钟

---

### 方案 B：暂时跳过数据库，仅部署前端

**优点**：
- ✅ 快速部署查看界面
- ✅ 稍后添加数据库

**缺点**：
- ❌ 无法注册/登录
- ❌ 功能不完整

---

## 🎯 推荐：方案 A - 创建云端 Supabase

让我指导您完整部署，包括创建 Supabase 项目。

---

## 第一部分：创建云端 Supabase 项目

### 步骤 1：注册/登录 Supabase

1. **访问** https://supabase.com
2. **点击** 右上角 "Start your project"
3. **选择** "Continue with GitHub"（推荐）
4. **授权** Supabase 访问

### 步骤 2：创建新项目

1. **选择组织**
   - 如果没有组织，会自动创建一个
   - 组织名称可以是您的 GitHub 用户名

2. **点击** "New Project"

3. **填写项目信息**：
   ```
   Name: slotify-production
   Database Password: [生成强密码，请记住！]
   Region: Southeast Asia (Singapore)  [选择离您最近的区域]
   Pricing Plan: Free
   ```

4. **点击** "Create new project"

5. **等待** 项目创建（约 2 分钟）

### 步骤 3：获取 Supabase 配置

项目创建完成后：

1. **点击** 左侧 Settings 图标 ⚙️
2. **选择** "API"
3. **复制以下信息**：

   **① Project URL**
   ```
   位置: Configuration → URL
   格式: https://xxxxx.supabase.co
   ```

   **② anon public key**
   ```
   位置: Project API keys → anon public
   点击 "Copy" 按钮
   ```

   **③ service_role secret key**
   ```
   位置: Project API keys → service_role secret
   点击眼睛图标显示
   点击 "Copy" 按钮
   ```

### 步骤 4：导入数据库结构

您需要在新的 Supabase 项目中创建数据库表。

1. **点击** 左侧 "SQL Editor"
2. **点击** "New query"
3. **运行迁移文件**：

   找到您本地项目中的数据库迁移文件，通常在：
   ```
   /Users/terry/Downloads/App_develop/Slotify/supabase/migrations/
   ```

   逐个运行这些 SQL 文件，或者：

4. **使用本地 Supabase 导出**：
   ```bash
   # 在本地终端运行
   supabase db dump -f backup.sql
   ```

   然后在云端 Supabase SQL Editor 中运行这个 SQL 文件。

---

## 第二部分：准备 Vercel 环境变量

现在您已经有了云端 Supabase，让我整理所有环境变量：

### ✅ 已准备好的变量（直接使用）

```bash
# Sentry 配置
NEXT_PUBLIC_SENTRY_DSN=https://585031005b7e3d7efaf78d1790171ccc@o4510677488041984.ingest.us.sentry.io/4510677505015808
SENTRY_ORG=slotify
SENTRY_PROJECT=slotify
SENTRY_AUTH_TOKEN=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

# 应用配置
NEXT_PUBLIC_APP_URL=https://slotify.vercel.app
CRON_SECRET=somrOXlcl+hr7amhUvOhdpyKddBT66i1pd9wmEmKd7A=

# Gmail SMTP（来自您的 .env.local）
USE_SMTP=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tche1230@gmail.com
SMTP_PASS=qngamiziirtcqlfe
SMTP_FROM_EMAIL=tche1230@gmail.com
```

### ⏳ 需要您填写的变量（从新的 Supabase 获取）

```bash
NEXT_PUBLIC_SUPABASE_URL=[从步骤 3 获取]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[从步骤 3 获取]
SUPABASE_SERVICE_ROLE_KEY=[从步骤 3 获取]
```

---

## 第三部分：部署到 Vercel

### 步骤 1：登录 Vercel

1. **访问** https://vercel.com/login
2. **点击** "Continue with GitHub"
3. **授权** Vercel

### 步骤 2：导入项目

1. **点击** 右上角 "Add New..." → "Project"
2. **找到** "Slotify" 仓库
3. **点击** "Import"

### 步骤 3：配置环境变量

在项目配置页面：

1. **展开** "Environment Variables" 部分

2. **逐个添加变量**（共 13 个）：

   **Supabase (3个)**
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: [您的云端 Supabase URL]

   Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: [您的 anon key]

   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [您的 service_role key]
   ```

   **应用配置 (2个)**
   ```
   Name: NEXT_PUBLIC_APP_URL
   Value: https://slotify.vercel.app

   Name: CRON_SECRET
   Value: somrOXlcl+hr7amhUvOhdpyKddBT66i1pd9wmEmKd7A=
   ```

   **Sentry (4个)**
   ```
   Name: NEXT_PUBLIC_SENTRY_DSN
   Value: https://585031005b7e3d7efaf78d1790171ccc@o4510677488041984.ingest.us.sentry.io/4510677505015808

   Name: SENTRY_ORG
   Value: slotify

   Name: SENTRY_PROJECT
   Value: slotify

   Name: SENTRY_AUTH_TOKEN
   Value: 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
   ```

   **Gmail SMTP (4个)**
   ```
   Name: USE_SMTP
   Value: true

   Name: SMTP_HOST
   Value: smtp.gmail.com

   Name: SMTP_PORT
   Value: 587

   Name: SMTP_USER
   Value: tche1230@gmail.com

   Name: SMTP_PASS
   Value: qngamiziirtcqlfe

   Name: SMTP_FROM_EMAIL
   Value: tche1230@gmail.com
   ```

3. **确认** 所有 13 个变量都已添加

### 步骤 4：部署

1. **点击** "Deploy" 按钮
2. **等待** 构建完成（2-5 分钟）
3. **查看** 构建日志，确认没有错误

### 步骤 5：部署后配置

1. **复制** Vercel 显示的实际 URL（例如：`https://slotify-abc123.vercel.app`）

2. **更新** NEXT_PUBLIC_APP_URL：
   - Vercel 项目 → Settings → Environment Variables
   - 找到 `NEXT_PUBLIC_APP_URL`
   - 点击 "..." → "Edit"
   - 更新为实际 URL
   - 点击 "Save"

3. **重新部署**：
   - Deployments → 最新部署 → "..." → "Redeploy"

---

## 第四部分：验证部署

### 测试清单

访问您的 Vercel URL，测试以下功能：

1. **基础功能**
   - [ ] 页面正常加载
   - [ ] 样式显示正确
   - [ ] 无控制台错误

2. **用户功能**
   - [ ] 可以注册新账号
   - [ ] 可以登录
   - [ ] 可以访问仪表板

3. **数据库功能**
   - [ ] 可以创建服务
   - [ ] 可以设置可用时间
   - [ ] 可以创建预约

4. **邮件功能**
   - [ ] 注册时收到确认邮件
   - [ ] 预约时收到确认邮件

5. **监控功能**
   - [ ] Sentry 控制台显示事件

---

## 🎉 部署完成检查清单

完成后您将拥有：

- ✅ 应用部署在 Vercel 云端
- ✅ 数据库运行在 Supabase 云端
- ✅ 错误监控（Sentry）
- ✅ 邮件通知（Gmail SMTP）
- ✅ HTTPS 自动加密
- ✅ 外部可访问
- ✅ 完全免费

---

## 💰 成本确认

**月度成本**: $0

- Vercel Hobby: $0
- Supabase Free: $0 (500MB 数据库)
- Sentry Developer: $0 (5K errors)
- Gmail SMTP: $0 (500 邮件/天)

---

## 🐛 常见问题

### Q: Gmail SMTP 发送失败？
A: 需要启用 Gmail "允许不够安全的应用访问" 或使用应用专用密码

### Q: 数据库迁移如何操作？
A: 在 Supabase SQL Editor 中运行本地的迁移文件

### Q: 构建失败怎么办？
A: 查看 Vercel 构建日志，检查环境变量是否正确

---

**准备好了吗？从第一部分开始！** 🚀

如有任何问题，随时告诉我！
