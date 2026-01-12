# 📱💻 响应式布局实现指南

## ✅ 已完成 - Phase 1

### 1. 自定义 Hooks

#### `useMediaQuery` - 媒体查询 Hook
```typescript
import { useMediaQuery } from '@/hooks'

// 使用示例
const isDesktop = useMediaQuery('(min-width: 1024px)')
const isMobile = useMediaQuery('(max-width: 767px)')
```

#### `useDeviceType` - 设备类型检测
```typescript
import { useDeviceType, useIsMobile, useIsDesktop } from '@/hooks'

// 方式 1: 获取详细设备信息
const { isMobile, isTablet, isDesktop, isLargeDesktop } = useDeviceType()

// 方式 2: 简化版本
const isMobile = useIsMobile() // true if < 768px
const isDesktop = useIsDesktop() // true if >= 768px
```

### 2. 响应式布局组件

#### `ResponsiveLayout` - 自动切换布局
这是主要的布局组件，会根据屏幕尺寸自动切换移动端和桌面端布局。

```typescript
import { ResponsiveLayout } from '@/components/layouts'

export default function Page() {
  return (
    <ResponsiveLayout
      userEmail="user@example.com"
      displayName="John Doe"
      avatarUrl="/avatar.jpg"
    >
      <YourPageContent />
    </ResponsiveLayout>
  )
}
```

---

## 🎨 桌面端布局特性

当在桌面端（≥768px）访问时，用户会看到：

### 侧边栏导航
- 左侧固定宽度侧边栏（264px）
- Logo 和应用名称
- 导航菜单：
  - 🏠 Home
  - 📅 Calendar
  - 💼 Services
  - ⚙️ Settings
- 用户信息和登出按钮

### 顶部标题栏
- 当前页面标题
- 预留区域用于搜索、通知等功能

### 主内容区
- 最大宽度约束（max-w-7xl）
- 居中显示
- 更宽松的内边距（p-8）

---

## 📱 移动端布局特性

当在移动端（<768px）访问时，保持现有设计：

- 全屏沉浸式
- 底部导航栏
- 垂直滚动
- 紧凑的内边距

---

## 🚀 如何在现有页面中集成

### 方法 1: 包装整个页面（推荐）

```typescript
// src/app/app/today/page.tsx
import { ResponsiveLayout } from '@/components/layouts'
import { createClient } from '@/utils/supabase/server'

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 获取用户资料
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <ResponsiveLayout
      userEmail={user.email}
      displayName={profile?.full_name}
      avatarUrl={profile?.avatar_url}
    >
      {/* 你的页面内容 */}
      <div>
        <h1>Today's Bookings</h1>
        {/* ... */}
      </div>
    </ResponsiveLayout>
  )
}
```

### 方法 2: 条件渲染不同布局

如果你需要在移动端和桌面端显示完全不同的内容：

```typescript
'use client'

import { useIsMobile } from '@/hooks'
import { MobileView } from './MobileView'
import { DesktopView } from './DesktopView'

export default function MyPage() {
  const isMobile = useIsMobile()

  return isMobile ? <MobileView /> : <DesktopView />
}
```

### 方法 3: 响应式样式（Tailwind）

使用 Tailwind 的响应式前缀：

```tsx
<div className="
  px-4 md:px-8          /* 移动端 16px，桌面端 32px */
  text-sm md:text-base  /* 移动端小字，桌面端正常 */
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  /* 响应式网格 */
">
  {/* 内容 */}
</div>
```

---

## 🎯 响应式断点

```typescript
// Tailwind 断点
sm: 640px   // 大屏手机（横屏）
md: 768px   // 平板
lg: 1024px  // 小型笔记本
xl: 1280px  // 桌面
2xl: 1536px // 大屏显示器
```

---

## 💡 最佳实践

### 1. SSR 兼容性
✅ **DO** - 所有 hooks 都已处理 SSR
```typescript
const isMobile = useIsMobile() // ✅ 安全，不会导致hydration错误
```

❌ **DON'T** - 避免直接使用 window
```typescript
const width = window.innerWidth // ❌ 在 SSR 时会出错
```

### 2. 性能优化
使用动态导入分割代码：

```typescript
import dynamic from 'next/dynamic'

const DesktopDashboard = dynamic(
  () => import('@/components/DesktopDashboard'),
  { ssr: false }
)

function MyComponent() {
  const { isDesktop } = useDeviceType()

  return isDesktop ? <DesktopDashboard /> : <MobileDashboard />
}
```

### 3. 避免布局闪烁
使用 CSS 而非 JS 进行简单的响应式：

```tsx
// ✅ 好 - 使用 CSS（无闪烁）
<div className="block md:hidden">移动端内容</div>
<div className="hidden md:block">桌面端内容</div>

// ⚠️ 谨慎使用 - 可能有短暂闪烁
{isMobile && <MobileContent />}
{isDesktop && <DesktopContent />}
```

---

## 🧪 测试

### 浏览器开发工具
1. 打开 Chrome DevTools (F12)
2. 点击设备工具栏按钮 (Ctrl+Shift+M)
3. 选择不同设备预设或自定义尺寸

### 测试清单
- [ ] 768px 以下显示移动端布局
- [ ] 768px 以上显示桌面端布局
- [ ] 调整窗口大小时平滑切换
- [ ] 移动端底部导航正常工作
- [ ] 桌面端侧边栏导航正常工作
- [ ] 没有 hydration 错误
- [ ] 没有布局闪烁

---

## 📦 文件结构

```
src/
├── hooks/
│   ├── index.ts                  # 导出所有 hooks
│   ├── useMediaQuery.ts          # 媒体查询 hook
│   └── useDeviceType.ts          # 设备类型检测
│
├── components/
│   └── layouts/
│       ├── index.ts              # 导出所有布局
│       ├── MobileLayout.tsx      # 移动端布局
│       ├── DesktopLayout.tsx     # 桌面端布局
│       └── ResponsiveLayout.tsx  # 响应式包装器
```

---

## 🎬 下一步 - Phase 2

现在基础框架已经完成，接下来可以：

### 1. 调整现有页面
- 在主要页面中集成 `ResponsiveLayout`
- 测试移动端和桌面端的显示效果

### 2. 优化桌面端体验
- 实现桌面端专用的日历视图
- 多列布局优化
- 添加键盘快捷键

### 3. 组件库扩展
- 创建响应式卡片组件
- 响应式表格组件
- 响应式对话框

---

## 🐛 常见问题

### Q: Hydration 错误怎么办？
A: 确保使用 `useMediaQuery` 而不是直接访问 `window`。我们的 hooks 已经处理了 SSR。

### Q: 如何禁用桌面端布局？
A: 如果某个页面不需要响应式布局，直接不使用 `ResponsiveLayout` 即可。

### Q: 移动端能强制显示桌面版吗？
A: 不推荐。如果确实需要，可以添加一个用户偏好设置来切换。

---

## 📞 需要帮助？

如果在实现过程中遇到问题：
1. 检查浏览器控制台是否有错误
2. 确认导入路径正确
3. 验证 Tailwind 配置

**祝你实现顺利！** 🚀
