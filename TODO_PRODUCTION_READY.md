# Slotify 生产就绪 Todo List

**生成日期**: 2026-01-08
**目标**: 4-6周内达到生产就绪状态

---

## 🔴 P0 - 阻断性问题 (必须完成才能发布)

### 1. 错误监控和日志 [2天]

#### 1.1 集成 Sentry [1天]
- [ ] 注册 Sentry 账号 (sentry.io)
- [ ] 安装依赖
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard@latest -i nextjs
  ```
- [ ] 配置客户端 (sentry.client.config.ts)
  ```typescript
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
  ```
- [ ] 配置服务端 (sentry.server.config.ts)
- [ ] 配置 Edge (sentry.edge.config.ts)
- [ ] 添加 Source Maps 上传
- [ ] 测试错误捕获
  - [ ] 客户端错误
  - [ ] 服务端错误
  - [ ] API 路由错误
- [ ] 配置过滤规则 (排除敏感信息)
- [ ] 设置告警规则

#### 1.2 结构化日志 [0.5天]
- [ ] 替换 console.log 为结构化日志
  ```typescript
  // lib/logger.ts
  export const logger = {
    info: (message, meta) => {...},
    error: (message, error, meta) => {...},
    warn: (message, meta) => {...}
  }
  ```
- [ ] 添加请求 ID 追踪
- [ ] 添加用户上下文

#### 1.3 性能监控 [0.5天]
- [ ] 启用 Vercel Analytics
- [ ] 配置 Sentry Performance Monitoring
- [ ] 添加自定义性能指标
  - [ ] 预约创建耗时
  - [ ] 可用时间槽计算耗时
  - [ ] 邮件发送耗时

---

### 2. 测试基础设施 [5天]

#### 2.1 单元测试 - 核心逻辑 [3天]

**优先级 1 - 防止双重预约**
- [ ] `lib/availability.test.ts` (2天) ✅ 已开始
  - [ ] 测试过去日期不返回时间槽
  - [ ] 测试最小通知时间限制
  - [ ] 测试预约冲突检测
  - [ ] 测试忙碌时间块冲突
  - [ ] 测试缓冲时间计算
  - [ ] 测试时区转换
  - [ ] 测试跨天规则
  - [ ] 测试无规则返回空
  - [ ] 测试多个规则合并
  - [ ] Edge cases: 午夜时间槽

**优先级 2 - 安全和验证**
- [ ] `lib/rate-limit.test.ts` (0.5天)
  - [ ] 测试限流计数器
  - [ ] 测试窗口重置
  - [ ] 测试并发请求
  - [ ] 测试 IP 提取
- [ ] `lib/validations.test.ts` (0.5天) ✅ 已存在，需扩展
  - [ ] 添加更多 edge cases
  - [ ] 测试邮件验证 (现在是必填)
  - [ ] 测试 XSS 输入
  - [ ] 测试 SQL 注入输入

#### 2.2 集成测试 - Server Actions [1.5天]
- [ ] `app/actions/booking.test.ts`
  - [ ] 测试创建预约成功
  - [ ] 测试冲突预约失败
  - [ ] 测试 token 生成
  - [ ] 测试审计日志创建
- [ ] `app/actions/cancel.test.ts`
  - [ ] 测试 token 验证
  - [ ] 测试过期 token
  - [ ] 测试无效 token
  - [ ] 测试取消逻辑

#### 2.3 API 端点测试 [0.5天]
- [ ] `app/api/book/route.test.ts`
  - [ ] 测试 201 成功响应
  - [ ] 测试 400 验证错误
  - [ ] 测试 404 服务不存在
  - [ ] 测试 409 时间冲突
  - [ ] 测试 429 限流
- [ ] `app/api/cron/reminders/route.test.ts`
  - [ ] 测试 401 未授权
  - [ ] 测试提醒发送逻辑

#### 2.4 测试配置 [已完成 ✅]
- [x] Vitest 已配置
- [x] @testing-library/react 已安装
- [ ] 添加测试覆盖率报告
  ```bash
  npm run test:coverage
  ```
- [ ] 设置覆盖率目标 (60% 初期，80% 最终)

---

### 3. 生产级限流器 [1天]

#### 3.1 Upstash Redis 集成 [0.5天]
- [ ] 注册 Upstash 账号 (upstash.com)
- [ ] 创建 Redis 数据库
- [ ] 获取连接信息
- [ ] 添加环境变量
  ```env
  UPSTASH_REDIS_REST_URL=https://...
  UPSTASH_REDIS_REST_TOKEN=...
  ```
- [ ] 安装依赖
  ```bash
  npm install @upstash/ratelimit @upstash/redis
  ```

#### 3.2 替换限流实现 [0.3天]
- [ ] 创建 `lib/rate-limit-redis.ts`
  ```typescript
  import { Ratelimit } from '@upstash/ratelimit'
  import { Redis } from '@upstash/redis'

  export const bookingRateLimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'slotify:booking'
  })
  ```
- [ ] 更新 `app/api/book/route.ts` 使用新限流器
- [ ] 保留旧限流器作为降级方案

#### 3.3 添加更多限流规则 [0.2天]
- [ ] 登录端点限流 (5 次/15分钟)
- [ ] 注册端点限流 (3 次/小时)
- [ ] API 全局限流 (100 次/分钟)

---

### 4. 数据库约束验证 [0.5天]

#### 4.1 检查所有迁移 [0.2天]
- [ ] 验证 email 必填约束已生效
  ```sql
  SELECT constraint_name, constraint_type
  FROM information_schema.table_constraints
  WHERE table_name = 'bookings';
  ```
- [ ] 测试插入缺少 email 的记录 (应该失败)

#### 4.2 添加缺失的约束 [0.3天]
- [ ] 确保 phone 不为空字符串
  ```sql
  ALTER TABLE bookings
  ADD CONSTRAINT client_phone_not_empty
  CHECK (client_phone != '');
  ```
- [ ] 确保服务时长在合理范围 (5-480分钟)
- [ ] 确保价格非负

---

### 5. 安全加固 [2天]

#### 5.1 CSP (Content Security Policy) [1天]
- [ ] 在 `next.config.mjs` 添加 CSP header ✨ (部分已完成)
  ```javascript
  headers: [{
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js 需要
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
      "frame-ancestors 'none'"
    ].join('; ')
  }]
  ```
- [ ] 测试 CSP 不破坏功能
- [ ] 使用 report-uri 收集违规报告

#### 5.2 登录安全 [0.5天]
- [ ] 实现登录尝试限制
  ```typescript
  // lib/auth-rate-limit.ts
  export async function checkLoginAttempts(email: string) {
    const key = `login:${email}`
    const attempts = await redis.incr(key)
    if (attempts === 1) {
      await redis.expire(key, 900) // 15分钟
    }
    if (attempts > 5) {
      throw new Error('Too many login attempts')
    }
  }
  ```
- [ ] 添加账户锁定逻辑
- [ ] 失败后显示友好错误

#### 5.3 CSRF 保护验证 [0.2天]
- [ ] 确认 Next.js Server Actions CSRF 保护已启用
- [ ] 测试跨站请求被拒绝

#### 5.4 环境变量安全 [0.3天]
- [ ] 验证敏感变量不暴露给客户端
- [ ] 检查 `.gitignore` 包含 `.env*`
- [ ] 文档化必需的环境变量
- [ ] 生产环境使用密钥管理服务

---

## 🟡 P1 - 高优先级 (Beta 前完成)

### 6. 邮件验证流程 [2天]

#### 6.1 数据库迁移 [0.5天]
- [ ] 创建迁移文件
  ```sql
  -- 20260109000000_add_email_verification.sql
  ALTER TABLE profiles
  ADD COLUMN email_verified BOOLEAN DEFAULT false,
  ADD COLUMN email_verification_token TEXT,
  ADD COLUMN email_verification_sent_at TIMESTAMPTZ;

  CREATE INDEX idx_profiles_email_verification_token
  ON profiles(email_verification_token);
  ```
- [ ] 运行迁移
- [ ] 标记现有用户为已验证 (迁移脚本)

#### 6.2 验证邮件实现 [0.5天]
- [ ] 创建邮件模板 (`lib/email/templates/verify.ts`)
  ```typescript
  export function verificationEmail(token: string) {
    const link = `${baseUrl}/verify-email?token=${token}`
    return {
      subject: 'Verify your email',
      html: `Click here to verify: <a href="${link}">Verify</a>`
    }
  }
  ```
- [ ] 注册时发送验证邮件
- [ ] 生成安全 token (crypto.randomBytes)

#### 6.3 验证端点 [0.5天]
- [ ] 创建 `/verify-email/page.tsx`
- [ ] 验证 token 有效性
- [ ] 更新用户状态
- [ ] 显示成功/失败消息

#### 6.4 限制未验证用户 [0.5天]
- [ ] 提醒邮件仅发送给已验证用户
- [ ] 仪表板显示验证提示
- [ ] 添加重新发送验证邮件功能

---

### 7. 部署配置 [1天]

#### 7.1 Vercel 配置 [0.5天]
- [ ] 创建 `vercel.json`
  ```json
  {
    "buildCommand": "npm run build",
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
      "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role",
      "NEXT_PUBLIC_APP_URL": "@app-url"
    },
    "crons": [{
      "path": "/api/cron/reminders",
      "schedule": "0 9 * * *"
    }],
    "regions": ["sfo1"]
  }
  ```
- [ ] 配置环境变量映射
- [ ] 设置 Cron 任务

#### 7.2 GitHub 仓库设置 [0.2天]
- [ ] 创建 GitHub 仓库
- [ ] 推送代码
- [ ] 设置分支保护规则
- [ ] 配置 PR 模板

#### 7.3 Vercel 项目连接 [0.3天]
- [ ] 导入 GitHub 仓库到 Vercel
- [ ] 配置生产环境变量
- [ ] 配置预览环境变量
- [ ] 首次部署

---

### 8. 健康检查和监控 [1天]

#### 8.1 健康检查端点 [0.5天]
- [ ] 创建 `app/api/health/route.ts`
  ```typescript
  export async function GET() {
    const checks = {
      database: await checkDatabase(),
      email: await checkEmail(),
      redis: await checkRedis(),
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }

    const healthy = Object.entries(checks)
      .filter(([k]) => k !== 'timestamp' && k !== 'uptime')
      .every(([_, v]) => v === true)

    return Response.json(
      { status: healthy ? 'healthy' : 'degraded', checks },
      { status: healthy ? 200 : 503 }
    )
  }

  async function checkDatabase() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      return !error
    } catch {
      return false
    }
  }
  ```
- [ ] 测试健康检查
- [ ] 配置 Vercel 健康检查

#### 8.2 UptimeRobot 设置 [0.3天]
- [ ] 注册 UptimeRobot 账号
- [ ] 添加网站监控 (每5分钟)
- [ ] 添加健康检查监控
- [ ] 配置告警通知 (邮件/Slack)

#### 8.3 性能监控 [0.2天]
- [ ] 启用 Vercel Web Analytics
- [ ] 添加自定义事件追踪
  - Booking created
  - Email sent
  - Cancellation confirmed

---

### 9. 数据库备份策略 [1天]

#### 9.1 Supabase 配置 [0.3天]
- [ ] 升级到 Supabase Pro (如需要 PITR)
- [ ] 启用 Point-in-Time Recovery
- [ ] 验证自动备份设置

#### 9.2 手动备份脚本 [0.4天]
- [ ] 创建 `scripts/backup-db.sh`
  ```bash
  #!/bin/bash
  DATE=$(date +%Y%m%d_%H%M%S)
  pg_dump $DATABASE_URL > "backups/slotify_$DATE.sql"
  gzip "backups/slotify_$DATE.sql"
  ```
- [ ] 设置 Cron (每周日 2am)
- [ ] 上传到 S3/R2 等对象存储

#### 9.3 恢复测试 [0.3天]
- [ ] 文档化恢复步骤
- [ ] 创建测试数据库
- [ ] 测试从备份恢复
- [ ] 验证数据完整性

---

### 10. 文档完善 [2天]

#### 10.1 API 文档 [1天]
- [ ] 创建 `docs/API.md`
- [ ] 记录所有 API 端点
  - `/api/book` - POST
  - `/api/cron/reminders` - GET
  - `/api/health` - GET
- [ ] 请求/响应示例
- [ ] 错误代码说明
- [ ] Rate limit 说明

#### 10.2 部署文档 [0.5天]
- [ ] 创建 `docs/DEPLOYMENT.md`
- [ ] 环境变量完整列表
- [ ] 部署步骤详细说明
- [ ] 回滚步骤
- [ ] 故障排查指南

#### 10.3 运维手册 [0.5天]
- [ ] 创建 `docs/OPERATIONS.md`
- [ ] 监控面板链接
- [ ] 告警响应流程
- [ ] 常见问题解决
- [ ] 紧急联系方式

---

## 🔵 P2 - 中等优先级 (生产发布前)

### 11. CI/CD 管道 [1天]

#### 11.1 GitHub Actions - 测试 [0.3天]
- [ ] 创建 `.github/workflows/test.yml`
  ```yaml
  name: Test
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with:
            node-version: 20
        - run: npm ci
        - run: npm run lint
        - run: npm test
        - run: npm run build
  ```

#### 11.2 GitHub Actions - 部署 [0.4天]
- [ ] 创建 `.github/workflows/deploy.yml`
- [ ] 配置 Vercel 部署 token
- [ ] 自动部署到预览环境 (PR)
- [ ] 手动触发生产部署

#### 11.3 代码质量检查 [0.3天]
- [ ] 添加 Prettier
  ```bash
  npm install -D prettier
  ```
- [ ] 配置 `.prettierrc`
- [ ] 添加 lint-staged + husky
  ```bash
  npx husky-init
  npm install -D lint-staged
  ```
- [ ] 配置 pre-commit hook

---

### 12. 邮件队列系统 [2天]

#### 12.1 Inngest 集成 [1天]
- [ ] 注册 Inngest 账号
- [ ] 安装依赖
  ```bash
  npm install inngest
  ```
- [ ] 创建 Inngest 客户端 (`lib/inngest/client.ts`)
- [ ] 创建邮件发送函数
  ```typescript
  export const sendEmail = inngest.createFunction(
    {
      id: 'send-email',
      retries: 3,
      rateLimit: { limit: 100, period: '1m' }
    },
    { event: 'email/send' },
    async ({ event }) => {
      await emailService.send(event.data)
    }
  )
  ```

#### 12.2 重构邮件发送 [0.5天]
- [ ] 替换同步调用为事件触发
  ```typescript
  // 之前: await emailService.send(...)
  // 之后: await inngest.send({ name: 'email/send', data: {...} })
  ```
- [ ] 更新所有邮件发送点
  - 预约确认
  - 取消通知
  - 重新预约
  - 提醒

#### 12.3 失败处理 [0.5天]
- [ ] 配置重试策略
- [ ] 添加 Dead Letter Queue
- [ ] 失败告警通知
- [ ] 监控面板

---

### 13. 性能优化 [2天]

#### 13.1 数据库查询优化 [1天]
- [ ] 分析慢查询
- [ ] 添加缺失索引
  ```sql
  CREATE INDEX idx_bookings_provider_status_start
  ON bookings(provider_id, status, start_at);
  ```
- [ ] 优化 `getAvailableSlots` 查询
- [ ] 添加查询缓存 (Redis)

#### 13.2 前端优化 [0.5天]
- [ ] 图片优化 (WebP 转换)
- [ ] 代码分割 (动态导入大组件)
- [ ] 懒加载非关键组件
- [ ] 预加载关键资源

#### 13.3 Lighthouse 优化 [0.5天]
- [ ] 运行 Lighthouse 审计
- [ ] 修复所有红色项
- [ ] 目标分数
  - Performance: >90
  - Accessibility: >95
  - Best Practices: >95
  - SEO: >90

---

### 14. 负载测试 [1天]

#### 14.1 测试准备 [0.3天]
- [ ] 安装 k6 或 Artillery
  ```bash
  npm install -g k6
  ```
- [ ] 创建测试场景 (`tests/load/booking.js`)

#### 14.2 执行测试 [0.4天]
- [ ] 并发预约测试 (100 用户)
- [ ] 峰值负载测试 (500 用户)
- [ ] 持续负载测试 (4小时)
- [ ] 记录性能指标
  - 响应时间 (P50, P95, P99)
  - 错误率
  - 吞吐量

#### 14.3 优化和修复 [0.3天]
- [ ] 分析瓶颈
- [ ] 修复性能问题
- [ ] 重新测试验证

---

### 15. 安全审计 [2天]

#### 15.1 自动化扫描 [0.5天]
- [ ] npm audit
- [ ] Snyk 扫描依赖漏洞
- [ ] OWASP ZAP 扫描
- [ ] 修复高危和中危漏洞

#### 15.2 手动审计 [1天]
- [ ] SQL 注入测试
- [ ] XSS 测试
- [ ] CSRF 测试
- [ ] 权限提升测试
- [ ] 敏感信息泄露检查

#### 15.3 修复和文档 [0.5天]
- [ ] 修复发现的问题
- [ ] 文档化安全最佳实践
- [ ] 创建安全检查清单

---

## 🟢 P3 - 低优先级 (未来改进)

### 16. 高级功能 (路线图)
- [ ] SMS 通知 (Twilio)
- [ ] 支付集成 (Stripe)
- [ ] 双向日历同步
- [ ] 多语言支持 (i18n)
- [ ] 移动 App (React Native)
- [ ] 分析仪表板
- [ ] 等候名单
- [ ] 循环预约
- [ ] 团队管理

### 17. 用户体验优化
- [ ] 引导流程 (Onboarding)
- [ ] 空状态优化
- [ ] 骨架屏加载
- [ ] 乐观更新
- [ ] 离线模式增强

### 18. 运营工具
- [ ] Admin 仪表板
- [ ] 用户管理
- [ ] 数据导出
- [ ] 批量操作
- [ ] 审计日志查看器

---

## 📅 时间线估算

### 周 1: 基础设施 (关键)
- **周一**: Sentry + 结构化日志 (1天)
- **周二**: Upstash Redis (1天)
- **周三-周五**: 核心测试 (availability, rate-limit, validations) (3天)

**交付物**: 错误监控就绪, 生产级限流, 3个测试文件

---

### 周 2: 安全和监控
- **周一**: CSP 和登录安全 (1天)
- **周二**: 健康检查 + UptimeRobot (1天)
- **周三-周四**: 邮件验证流程 (2天)
- **周五**: vercel.json + 部署配置 (1天)

**交付物**: 安全加固, 监控就绪, 邮件验证, 可自动部署

---

### 周 3: 测试和优化
- **周一-周二**: 更多测试 (Server Actions, API) (2天)
- **周三**: 数据库备份策略 (1天)
- **周四**: CI/CD 管道 (1天)
- **周五**: 文档完善 (1天)

**交付物**: 测试覆盖率 >60%, 备份就绪, CI/CD 工作

---

### 周 4: 质量保证
- **周一**: 邮件队列 (1天)
- **周二**: 性能优化 (1天)
- **周三**: 负载测试 (1天)
- **周四**: 安全审计 (1天)
- **周五**: 修复和 Beta 准备 (1天)

**交付物**: 性能优化, 负载测试通过, 安全审计完成, Beta 就绪

---

### 周 5-6: Beta 测试和修复
- Beta 用户测试
- Bug 修复
- 性能调优
- 文档更新
- 准备生产发布

---

## 📊 进度追踪

### 完成度计算
- **P0 (必须)**: 0/5 完成 (0%)
- **P1 (重要)**: 0/5 完成 (0%)
- **P2 (应该)**: 0/5 完成 (0%)
- **P3 (未来)**: 0/3 完成 (0%)

### 总体进度
**总任务数**: 350+ (预估)
**已完成**: 5 (package.json配置, next.config security headers, .gitignore, validations.test.ts, middleware.ts)
**完成率**: ~1.4%

---

## 🎯 里程碑

### 里程碑 1: Alpha 就绪 ✅
**目标日期**: 立即
**标准**:
- [x] 核心功能完整
- [x] 基础安全措施
- [x] 本地测试通过

### 里程碑 2: Beta 就绪
**目标日期**: +2 周
**标准**:
- [ ] 所有 P0 完成
- [ ] 50% P1 完成
- [ ] 测试覆盖率 >60%
- [ ] Sentry 监控就绪
- [ ] vercel.json 配置

### 里程碑 3: 生产就绪
**目标日期**: +4-6 周
**标准**:
- [ ] 所有 P0 和 P1 完成
- [ ] 50% P2 完成
- [ ] 测试覆盖率 >80%
- [ ] 负载测试通过
- [ ] 安全审计完成
- [ ] 文档完整

### 里程碑 4: 企业级
**目标日期**: +8-12 周
**标准**:
- [ ] 所有 P0-P2 完成
- [ ] 测试覆盖率 >90%
- [ ] 99.9% SLA
- [ ] 多地区部署

---

## 💡 优先级建议

**立即开始 (本周)**:
1. ✅ Sentry 集成 (阻断器)
2. ✅ Upstash Redis (阻断器)
3. ✅ availability.test.ts (阻断器)

**下周**:
4. ✅ CSP 配置
5. ✅ 健康检查
6. ✅ 邮件验证

**第三周**:
7. ✅ 更多测试
8. ✅ CI/CD
9. ✅ 文档

---

## ✅ 检查清单模板

使用这个检查清单追踪每个任务:

```markdown
## 任务: [任务名称]
- **优先级**: P0/P1/P2/P3
- **估算**: X 天
- **负责人**: [姓名]
- **开始日期**: YYYY-MM-DD
- **完成日期**: YYYY-MM-DD
- **状态**: 未开始/进行中/已完成/已阻塞

### 子任务
- [ ] 子任务 1
- [ ] 子任务 2
- [ ] 子任务 3

### 验收标准
- [ ] 标准 1
- [ ] 标准 2

### 测试
- [ ] 单元测试
- [ ] 集成测试
- [ ] 手动测试

### 文档
- [ ] 代码注释
- [ ] API 文档
- [ ] 用户文档

### 部署
- [ ] 预览环境测试
- [ ] 生产环境部署
```

---

**祝开发顺利! 🚀**
