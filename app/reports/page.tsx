'use client';

import Link from 'next/link';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">レポート・分析</h1>
            <Link
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Summary Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">今月の配送</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">352</div>
            <p className="text-sm text-green-600">↑ 12% 先月比</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">売上高</h3>
            <div className="text-4xl font-bold text-green-600 mb-2">¥2.5M</div>
            <p className="text-sm text-green-600">↑ 8% 先月比</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">配送成功率</h3>
            <div className="text-4xl font-bold text-purple-600 mb-2">98.5%</div>
            <p className="text-sm text-green-600">↑ 0.5% 先月比</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">配送件数推移</h3>
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600">📊</p>
                <p className="text-sm text-gray-500 mt-2">グラフ: 月別配送件数</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">トラック稼働率</h3>
            <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600">📈</p>
                <p className="text-sm text-gray-500 mt-2">グラフ: トラック別稼働率</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">トップ顧客</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">順位</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">顧客名</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">配送件数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">売上</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">1</td>
                  <td className="py-3 px-4 text-sm font-medium">山田商店</td>
                  <td className="py-3 px-4 text-sm">45件</td>
                  <td className="py-3 px-4 text-sm">¥450,000</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">2</td>
                  <td className="py-3 px-4 text-sm font-medium">佐藤物流</td>
                  <td className="py-3 px-4 text-sm">32件</td>
                  <td className="py-3 px-4 text-sm">¥320,000</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">3</td>
                  <td className="py-3 px-4 text-sm font-medium">田中運送</td>
                  <td className="py-3 px-4 text-sm">28件</td>
                  <td className="py-3 px-4 text-sm">¥280,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
