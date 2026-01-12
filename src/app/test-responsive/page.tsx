import { ResponsiveLayout } from '@/components/layouts'

export default function TestResponsivePage() {
  return (
    <ResponsiveLayout
      userEmail="test@slotify.com"
      displayName="Test User"
      avatarUrl={null}
    >
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-500/30 p-8 rounded-xl shadow-lg">
          <h1 className="text-4xl font-bold text-white mb-4">
            响应式布局测试页面
          </h1>
          <p className="text-gray-300 text-lg">
            调整浏览器窗口大小来查看布局变化
          </p>
        </div>

        {/* Device Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#2d3748] p-6 rounded-xl border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-2">📱 移动端</h3>
            <p className="text-gray-400">
              &lt; 768px<br />
              全屏布局<br />
              底部导航
            </p>
          </div>

          <div className="bg-[#2d3748] p-6 rounded-xl border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-2">💻 平板</h3>
            <p className="text-gray-400">
              768px - 1023px<br />
              混合布局<br />
              侧边栏导航
            </p>
          </div>

          <div className="bg-[#2d3748] p-6 rounded-xl border border-gray-600">
            <h3 className="text-xl font-bold text-white mb-2">🖥️ 桌面端</h3>
            <p className="text-gray-400">
              ≥ 1024px<br />
              宽屏布局<br />
              侧边栏导航
            </p>
          </div>
        </div>

        {/* Test Features */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">测试功能</h2>

          <div className="bg-[#2d3748] p-6 rounded-xl border border-gray-600 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-white">自动设备检测</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-white">SSR 安全（无 hydration 错误）</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-white">平滑布局切换</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-white">移动端保持现有设计</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full" />
              <span className="text-white">桌面端侧边栏导航</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/30 p-6 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-3">🧪 如何测试</h2>
          <ol className="text-gray-300 space-y-2 list-decimal list-inside">
            <li>打开浏览器开发者工具（F12）</li>
            <li>点击设备工具栏按钮（Ctrl+Shift+M 或 Cmd+Shift+M）</li>
            <li>选择不同的设备预设（iPhone, iPad, Desktop）</li>
            <li>观察布局的变化：
              <ul className="ml-8 mt-2 space-y-1 list-disc">
                <li>移动端：底部导航（如果有的话）</li>
                <li>桌面端：左侧边栏 + 顶部标题栏</li>
              </ul>
            </li>
          </ol>
        </div>

        {/* Responsive Grid Example */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">响应式网格示例</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <div
                key={num}
                className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-xl text-center"
              >
                <span className="text-white font-bold text-2xl">{num}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Screen Size Indicator */}
        <div className="bg-[#2d3748] p-6 rounded-xl border border-gray-600">
          <h2 className="text-xl font-bold text-white mb-3">当前屏幕尺寸</h2>
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-blue-600 rounded-lg text-white block sm:hidden">
              &lt; 640px (XS)
            </span>
            <span className="px-4 py-2 bg-green-600 rounded-lg text-white hidden sm:block md:hidden">
              640px - 767px (SM)
            </span>
            <span className="px-4 py-2 bg-yellow-600 rounded-lg text-white hidden md:block lg:hidden">
              768px - 1023px (MD)
            </span>
            <span className="px-4 py-2 bg-orange-600 rounded-lg text-white hidden lg:block xl:hidden">
              1024px - 1279px (LG)
            </span>
            <span className="px-4 py-2 bg-red-600 rounded-lg text-white hidden xl:block 2xl:hidden">
              1280px - 1535px (XL)
            </span>
            <span className="px-4 py-2 bg-purple-600 rounded-lg text-white hidden 2xl:block">
              ≥ 1536px (2XL)
            </span>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
