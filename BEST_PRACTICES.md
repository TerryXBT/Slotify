# 🚀 Slotify 可扩展性和最佳实践建议

## 📋 目录
1. [代码架构](#1-代码架构)
2. [数据库设计](#2-数据库设计)
3. [安全性](#3-安全性)
4. [性能优化](#4-性能优化)
5. [监控和日志](#5-监控和日志)
6. [测试策略](#6-测试策略)
7. [部署和 CI/CD](#7-部署和-cicd)
8. [团队协作](#8-团队协作)

---

## 1. 代码架构

### 1.1 推荐的文件夹结构

```
Slotify/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证相关路由组
│   │   ├── (dashboard)/       # 仪表盘路由组
│   │   ├── (booking)/         # 预订相关路由
│   │   └── api/               # API 路由
│   │
│   ├── components/
│   │   ├── layouts/           # 布局组件
│   │   ├── ui/                # 基础 UI 组件
│   │   ├── features/          # 功能组件
│   │   │   ├── booking/
│   │   │   ├── calendar/
│   │   │   └── dashboard/
│   │   └── shared/            # 共享组件
│   │
│   ├── lib/                   # 核心库和工具
│   │   ├── supabase/         # 数据库客户端
│   │   ├── email/            # 邮件服务
│   │   ├── analytics/        # 分析工具
│   │   └── utils/            # 工具函数
│   │
│   ├── hooks/                 # 自定义 Hooks
│   │   ├── useBooking.ts
│   │   ├── useAuth.ts
│   │   └── useMediaQuery.ts
│   │
│   ├── types/                 # TypeScript 类型定义
│   │   ├── database.types.ts # Supabase 自动生成
│   │   ├── booking.ts
│   │   └── user.ts
│   │
│   ├── stores/                # 状态管理 (Zustand/Jotai)
│   │   ├── bookingStore.ts
│   │   └── userStore.ts
│   │
│   └── config/                # 配置文件
│       ├── constants.ts
│       └── env.ts
│
├── public/                    # 静态资源
├── tests/                     # 测试文件
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/                      # 文档
└── scripts/                   # 脚本工具
```

### 1.2 组件设计原则

#### ✅ DO - 推荐的做法

```typescript
// 1. 单一职责原则
// ❌ 不好
function BookingPage() {
  // 包含了数据获取、状态管理、UI 渲染...
}

// ✅ 好
function BookingPage() {
  return (
    <BookingLayout>
      <BookingForm />
      <BookingCalendar />
      <BookingConfirmation />
    </BookingLayout>
  )
}

// 2. 使用组合而非继承
// ✅ 组合模式
<Card>
  <Card.Header>
    <Card.Title>预订详情</Card.Title>
  </Card.Header>
  <Card.Body>
    {content}
  </Card.Body>
</Card>

// 3. Props 验证和类型安全
interface BookingFormProps {
  serviceId: string
  onSubmit: (data: BookingData) => Promise<void>
  initialData?: Partial<BookingData>
}

function BookingForm({ serviceId, onSubmit, initialData }: BookingFormProps) {
  // ...
}

// 4. 自定义 Hook 提取逻辑
function useBookingForm(serviceId: string) {
  const [data, setData] = useState<BookingData>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleSubmit = async (formData: BookingData) => {
    // 业务逻辑
  }

  return { data, loading, error, handleSubmit }
}
```

### 1.3 状态管理建议

```typescript
// 推荐使用 Zustand (轻量级、简单)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BookingStore {
  selectedService: Service | null
  selectedSlot: TimeSlot | null
  setSelectedService: (service: Service) => void
  setSelectedSlot: (slot: TimeSlot) => void
  reset: () => void
}

export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      selectedService: null,
      selectedSlot: null,
      setSelectedService: (service) => set({ selectedService: service }),
      setSelectedSlot: (slot) => set({ selectedSlot: slot }),
      reset: () => set({ selectedService: null, selectedSlot: null }),
    }),
    {
      name: 'booking-storage',
      partialize: (state) => ({ selectedService: state.selectedService }), // 只持久化部分状态
    }
  )
)
```

---

## 2. 数据库设计

### 2.1 Supabase 表结构优化建议

```sql
-- 添加索引以提升查询性能
CREATE INDEX idx_bookings_provider_start
ON bookings(provider_id, start_at);

CREATE INDEX idx_bookings_status
ON bookings(status);

CREATE INDEX idx_services_provider_active
ON services(provider_id, is_active);

-- 添加全文搜索索引
CREATE INDEX idx_services_name_search
ON services USING gin(to_tsvector('english', name));

-- 添加触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2.2 数据完整性约束

```sql
-- 确保预订时间逻辑正确
ALTER TABLE bookings
ADD CONSTRAINT check_booking_times
CHECK (end_at > start_at);

-- 防止重复预订（同一时间段）
CREATE UNIQUE INDEX idx_no_overlapping_bookings
ON bookings(provider_id, start_at, end_at)
WHERE status != 'cancelled';

-- 软删除而非硬删除
ALTER TABLE bookings
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_bookings_not_deleted
ON bookings(provider_id)
WHERE deleted_at IS NULL;
```

### 2.3 Row Level Security (RLS) 策略

```sql
-- 用户只能看到自己的预订
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = provider_id OR client_email = auth.email());

-- 用户只能创建预订（不能修改他人的）
CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (true);

-- 只有提供者可以更新自己的预订
CREATE POLICY "Providers can update own bookings"
ON bookings FOR UPDATE
USING (auth.uid() = provider_id);
```

---

## 3. 安全性

### 3.1 环境变量管理

```bash
# .env.local (永远不要提交到 Git!)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # ⚠️ 仅服务端使用
SMTP_PASS=                  # ⚠️ 敏感信息

# 使用加密工具管理生产环境密钥
# 推荐: Doppler, Vault, AWS Secrets Manager
```

### 3.2 输入验证和清理

```typescript
// 使用 Zod 进行服务端验证
import { z } from 'zod'

const bookingSchema = z.object({
  client_name: z.string().min(2).max(100),
  client_email: z.string().email(),
  client_phone: z.string().regex(/^\+?[1-9]\d{1,14}$/), // E.164 格式
  service_id: z.string().uuid(),
  start_at: z.string().datetime(),
  notes: z.string().max(500).optional(),
})

// API 路由中使用
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = bookingSchema.parse(body) // 抛出错误如果无效

    // 处理预订...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.errors }, { status: 400 })
    }
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### 3.3 XSS 和 CSRF 防护

```typescript
// Next.js 默认提供 CSRF 保护，但要注意：

// 1. 永远不要使用 dangerouslySetInnerHTML
// ❌ 不好
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 好 - 使用库进行清理
import DOMPurify from 'isomorphic-dompurify'
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// 2. 设置安全的 HTTP 头
// next.config.js
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
  }
]
```

### 3.4 速率限制 (Rate Limiting)

```typescript
// lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 次/10秒
})

export async function checkRateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

  return {
    success,
    limit,
    remaining,
    reset: new Date(reset),
  }
}

// 在 API 路由中使用
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await checkRateLimit(ip)

  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 })
  }

  // 处理请求...
}
```

---

## 4. 性能优化

### 4.1 图片优化

```tsx
// 使用 Next.js Image 组件
import Image from 'next/image'

<Image
  src="/service-photo.jpg"
  alt="Service"
  width={800}
  height={600}
  priority={false} // 懒加载
  placeholder="blur" // 模糊占位符
  blurDataURL="data:image/..." // 或使用自动生成
  sizes="(max-width: 768px) 100vw, 50vw" // 响应式尺寸
/>

// 动态导入 Cloudinary/ImgIX 进行图片优化
```

### 4.2 代码分割

```typescript
// 动态导入重型组件
import dynamic from 'next/dynamic'

const BookingCalendar = dynamic(
  () => import('@/components/features/booking/BookingCalendar'),
  {
    loading: () => <CalendarSkeleton />,
    ssr: false, // 如果不需要 SSR
  }
)

// 条件加载桌面端组件
const DesktopDashboard = dynamic(
  () => import('@/components/layouts/DesktopDashboard'),
  { ssr: false }
)

function Dashboard() {
  const { isDesktop } = useDeviceType()

  return isDesktop ? <DesktopDashboard /> : <MobileDashboard />
}
```

### 4.3 数据库查询优化

```typescript
// ❌ 不好 - N+1 查询问题
async function getBookings() {
  const bookings = await supabase.from('bookings').select('*')

  for (const booking of bookings.data) {
    const service = await supabase
      .from('services')
      .select('*')
      .eq('id', booking.service_id)
      .single()
  }
}

// ✅ 好 - 使用 JOIN 一次性获取
async function getBookings() {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      services (
        name,
        duration_minutes,
        price
      ),
      profiles (
        full_name,
        avatar_url
      )
    `)
    .order('start_at', { ascending: true })
    .limit(50)

  return data
}

// 使用分页
async function getBookingsPaginated(page: number, pageSize: number = 20) {
  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact' })
    .range(from, to)

  return { data, totalPages: Math.ceil(count / pageSize) }
}
```

### 4.4 缓存策略

```typescript
// 使用 React Query 进行数据缓存
import { useQuery } from '@tanstack/react-query'

function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await supabase.from('services').select('*')
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 分钟内数据被认为是新鲜的
    cacheTime: 30 * 60 * 1000, // 缓存 30 分钟
  })
}

// Next.js 路由缓存
export const revalidate = 3600 // 1 小时重新验证
```

---

## 5. 监控和日志

### 5.1 错误追踪 - Sentry

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,

  // 性能监控
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],

  // 过滤敏感信息
  beforeSend(event) {
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers
    }
    return event
  },
})

// 在代码中使用
try {
  await createBooking(data)
} catch (error) {
  Sentry.captureException(error, {
    tags: { feature: 'booking' },
    extra: { bookingData: data },
  })
  throw error
}
```

### 5.2 分析和监控 - Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### 5.3 自定义日志系统

```typescript
// lib/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level
  }

  private log(level: LogLevel, message: string, meta?: any) {
    if (level < this.level) return

    const timestamp = new Date().toISOString()
    const levelName = LogLevel[level]

    console.log(JSON.stringify({
      timestamp,
      level: levelName,
      message,
      ...meta,
    }))

    // 生产环境发送到日志服务
    if (process.env.NODE_ENV === 'production') {
      // 发送到 Datadog, Logtail, CloudWatch 等
    }
  }

  info(message: string, meta?: any) {
    this.log(LogLevel.INFO, message, meta)
  }

  error(message: string, error: Error, meta?: any) {
    this.log(LogLevel.ERROR, message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...meta,
    })
  }
}

export const logger = new Logger()

// 使用
logger.info('Booking created', { bookingId: '123', userId: 'abc' })
logger.error('Failed to send email', error, { recipient: 'user@example.com' })
```

---

## 6. 测试策略

### 6.1 单元测试 - Vitest

```typescript
// tests/unit/booking.test.ts
import { describe, it, expect } from 'vitest'
import { validateBookingTime } from '@/lib/utils/booking'

describe('validateBookingTime', () => {
  it('should return true for valid future time', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
    expect(validateBookingTime(futureDate)).toBe(true)
  })

  it('should return false for past time', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(validateBookingTime(pastDate)).toBe(false)
  })
})
```

### 6.2 集成测试 - React Testing Library

```typescript
// tests/integration/BookingForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BookingForm } from '@/components/features/booking/BookingForm'

describe('BookingForm', () => {
  it('should submit booking successfully', async () => {
    const onSubmit = vi.fn()
    render(<BookingForm serviceId="123" onSubmit={onSubmit} />)

    // 填写表单
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'John Doe' }
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'john@example.com' }
    })

    // 提交
    fireEvent.click(screen.getByText('Confirm Booking'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          client_name: 'John Doe',
          client_email: 'john@example.com',
        })
      )
    })
  })
})
```

### 6.3 E2E 测试 - Playwright

```typescript
// tests/e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete booking flow', async ({ page }) => {
  // 访问预订页面
  await page.goto('/book/test-user')

  // 选择服务
  await page.click('text=Test Service')

  // 选择时间
  await page.click('button:has-text("4:00 PM")')

  // 填写表单
  await page.fill('input[name="name"]', 'Test User')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="phone"]', '+1234567890')

  // 提交预订
  await page.click('button:has-text("Confirm Booking")')

  // 验证成功
  await expect(page.locator('text=Booking Confirmed')).toBeVisible()
})

test('should show validation errors', async ({ page }) => {
  await page.goto('/book/test-user')
  await page.click('text=Test Service')
  await page.click('button:has-text("4:00 PM")')

  // 不填写任何信息直接提交
  await page.click('button:has-text("Confirm Booking")')

  // 按钮应该被禁用
  await expect(page.locator('button:has-text("Confirm Booking")')).toBeDisabled()
})
```

---

## 7. 部署和 CI/CD

### 7.1 Vercel 部署配置

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sfo1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "build": {
    "env": {
      "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        }
      ]
    }
  ]
}
```

### 7.2 GitHub Actions CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 7.3 数据库迁移策略

```bash
# 使用 Supabase CLI 管理迁移
supabase migration new add_booking_notes
supabase db push

# 在 CI/CD 中自动运行迁移
- name: Run database migrations
  run: |
    npm install -g supabase
    supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## 8. 团队协作

### 8.1 Git 工作流

```bash
# 功能分支模型
main          # 生产环境
├── develop   # 开发环境
│   ├── feature/booking-flow
│   ├── feature/desktop-ui
│   └── bugfix/email-sending

# 提交信息规范 (Conventional Commits)
feat: 添加桌面端导航栏
fix: 修复邮件发送失败的问题
docs: 更新 API 文档
style: 调整按钮样式
refactor: 重构预订流程代码
test: 添加预订表单测试
chore: 更新依赖包

# 使用 Commitlint 强制规范
npm install -D @commitlint/cli @commitlint/config-conventional
```

### 8.2 代码审查清单

```markdown
## Pull Request 审查清单

### 功能性
- [ ] 代码实现了 PR 描述的功能
- [ ] 没有引入新的 bug
- [ ] 边界情况已处理

### 代码质量
- [ ] 代码符合项目风格指南
- [ ] 变量和函数命名清晰
- [ ] 没有重复代码
- [ ] 复杂逻辑有注释

### 测试
- [ ] 添加了单元测试
- [ ] 添加了集成测试（如适用）
- [ ] 所有测试通过

### 性能
- [ ] 没有明显的性能问题
- [ ] 数据库查询已优化
- [ ] 大型组件使用了代码分割

### 安全性
- [ ] 用户输入已验证
- [ ] 没有暴露敏感信息
- [ ] 遵循最小权限原则

### 文档
- [ ] 更新了相关文档
- [ ] 添加了 JSDoc 注释（如适用）
```

### 8.3 开发环境设置

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}

// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "Prisma.prisma",
    "ms-playwright.playwright"
  ]
}
```

---

## 9. 总结和行动计划

### 立即实施 (本周)
1. ✅ 添加 `.gitignore` 确保 `.env.local` 不被提交
2. ✅ 设置 ESLint 和 Prettier
3. ✅ 添加基本的单元测试框架
4. ✅ 配置 Sentry 错误追踪

### 短期目标 (本月)
1. 🎯 实现响应式设计（桌面端）
2. 🎯 添加 E2E 测试
3. 🎯 优化数据库查询和索引
4. 🎯 设置 CI/CD pipeline

### 中期目标 (3-6 个月)
1. 🚀 实现高级功能（支付、提醒等）
2. 🚀 性能优化和监控
3. 🚀 多语言支持
4. 🚀 API 文档和开放平台

### 长期愿景 (6-12 个月)
1. 💡 AI 功能集成
2. 💡 原生移动应用
3. 💡 企业级功能
4. 💡 市场拓展

---

## 📚 推荐资源

### 学习资源
- [Next.js 官方文档](https://nextjs.org/docs)
- [Supabase 最佳实践](https://supabase.com/docs/guides/best-practices)
- [React 性能优化](https://react.dev/learn/render-and-commit)
- [Web.dev 性能指南](https://web.dev/performance/)

### 工具推荐
- **开发**: VSCode, Cursor, WebStorm
- **设计**: Figma, Sketch
- **监控**: Sentry, Datadog, Vercel Analytics
- **测试**: Vitest, Playwright, React Testing Library
- **协作**: Linear, Notion, Slack

---

**这份文档是一个活文档，随着项目发展应该持续更新！** 🚀
