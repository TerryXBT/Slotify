# 🗄️ 推送数据库到云端 Supabase

您已经有了云端 Supabase 配置，现在需要推送数据库结构。

---

## 方法 1：使用 Supabase CLI（推荐）

### 步骤 1：登录 Supabase CLI

在终端运行：

```bash
supabase login
```

这会打开浏览器让您授权。

### 步骤 2：链接到云端项目

```bash
cd /Users/terry/Downloads/App_develop/Slotify
supabase link --project-ref oqocvwpojhuzxyksousv
```

### 步骤 3：推送数据库结构

```bash
supabase db push
```

这会将您本地的所有迁移文件推送到云端。

---

## 方法 2：手动在 Supabase Dashboard 执行（备选）

如果 CLI 方法遇到问题，可以手动运行：

### 步骤 1：打开 SQL Editor

1. 访问 https://supabase.com/dashboard/project/oqocvwpojhuzxyksousv
2. 点击左侧 **SQL Editor**
3. 点击 **New query**

### 步骤 2：运行主 Schema

复制并运行 `supabase/schema.sql` 文件的内容

### 步骤 3：运行所有迁移文件

按顺序运行 `supabase/migrations/` 目录中的所有 SQL 文件。

---

## 方法 3：快速检查（推荐先做这个）

### 检查云端是否已有数据库表

1. 访问 https://supabase.com/dashboard/project/oqocvwpojhuzxyksousv
2. 点击左侧 **Table Editor**
3. 查看是否已有以下表：
   - `profiles`
   - `services`
   - `bookings`
   - `availability_rules`
   - `availability_settings`
   - `busy_blocks`
   - `action_tokens`
   - `reschedule_proposals`
   - `reschedule_options`
   - `audit_logs`

**如果已经有这些表**：
- ✅ 数据库已准备好
- 可以直接跳到 Vercel 部署

**如果没有或只有部分表**：
- 使用上面的方法 1 或 2 推送数据库

---

## ✋ 完成后告诉我

数据库推送完成后，请告诉我：
- [ ] 已完成数据库推送
- [ ] 云端已有所有必需的表

然后我们继续 Vercel 部署！

---

## 💡 快速建议

**最简单的方法**：
1. 在终端运行 `supabase login`
2. 在浏览器中授权
3. 回到终端运行 `supabase db push`

需要帮助的话随时告诉我！
