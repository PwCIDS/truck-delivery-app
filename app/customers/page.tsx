'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Customer {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  totalDeliveries: number;
}

export default function CustomersPage() {
  const [customers] = useState<Customer[]>([
    { id: 'C001', name: '山田商店', contact: '03-1234-5678', email: 'yamada@example.com', address: '東京都渋谷区1-2-3', totalDeliveries: 45 },
    { id: 'C002', name: '佐藤物流', contact: '03-2345-6789', email: 'sato@example.com', address: '東京都新宿区4-5-6', totalDeliveries: 32 },
    { id: 'C003', name: '田中運送', contact: '03-3456-7890', email: 'tanaka@example.com', address: '東京都港区7-8-9', totalDeliveries: 28 },
    { id: 'C004', name: '鈴木商事', contact: '03-4567-8901', email: 'suzuki@example.com', address: '東京都品川区10-11-12', totalDeliveries: 19 },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
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
          <h2 className="text-xl font-semibold text-gray-800">顧客一覧</h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200">
            + 新規顧客
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {customers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                  <p className="text-sm text-gray-500">{customer.id}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {customer.totalDeliveries}件
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start text-sm">
                  <span className="text-gray-600 w-20">電話:</span>
                  <span className="font-medium">{customer.contact}</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-600 w-20">メール:</span>
                  <span className="font-medium">{customer.email}</span>
                </div>
                <div className="flex items-start text-sm">
                  <span className="text-gray-600 w-20">住所:</span>
                  <span className="font-medium">{customer.address}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg transition duration-200 text-sm font-medium">
                  詳細
                </button>
                <button className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg transition duration-200 text-sm font-medium">
                  編集
                </button>
                <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 py-2 rounded-lg transition duration-200 text-sm font-medium">
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
