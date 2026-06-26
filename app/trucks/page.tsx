'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Truck {
  id: string;
  name: string;
  driver: string;
  status: 'available' | 'in-use' | 'maintenance';
  capacity: string;
  location: string;
}

export default function TrucksPage() {
  const [trucks] = useState<Truck[]>([
    { id: 'T001', name: 'トラック001', driver: '鈴木太郎', status: 'in-use', capacity: '2トン', location: '渋谷区' },
    { id: 'T002', name: 'トラック002', driver: '高橋花子', status: 'available', capacity: '4トン', location: '本社' },
    { id: 'T003', name: 'トラック003', driver: '伊藤次郎', status: 'in-use', capacity: '2トン', location: '港区' },
    { id: 'T004', name: 'トラック004', driver: '未割当', status: 'maintenance', capacity: '4トン', location: '整備工場' },
  ]);

  const getStatusBadge = (status: string) => {
    const styles = {
      available: 'bg-green-100 text-green-800',
      'in-use': 'bg-blue-100 text-blue-800',
      maintenance: 'bg-orange-100 text-orange-800',
    };
    const labels = {
      available: '利用可能',
      'in-use': '稼働中',
      maintenance: '整備中',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">トラック管理</h1>
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">トラック一覧</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
            + 新規トラック
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trucks.map((truck) => (
            <div key={truck.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{truck.name}</h3>
                  <p className="text-sm text-gray-500">{truck.id}</p>
                </div>
                {getStatusBadge(truck.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-20">ドライバー:</span>
                  <span className="font-medium">{truck.driver}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-20">積載量:</span>
                  <span className="font-medium">{truck.capacity}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 w-20">現在地:</span>
                  <span className="font-medium">{truck.location}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg transition duration-200 text-sm font-medium">
                  詳細
                </button>
                <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg transition duration-200 text-sm font-medium">
                  編集
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
