'use client';

import Link from 'next/link';
import { useState } from 'react';

interface TruckLocation {
  id: string;
  name: string;
  driver: string;
  lat: number;
  lng: number;
  status: string;
  speed: number;
  lastUpdate: string;
}

export default function GPSPage() {
  const [trucks] = useState<TruckLocation[]>([
    { id: 'T001', name: 'トラック001', driver: '鈴木太郎', lat: 35.6595, lng: 139.7004, status: '配送中', speed: 45, lastUpdate: '2分前' },
    { id: 'T002', name: 'トラック002', driver: '高橋花子', lat: 35.6812, lng: 139.7671, status: '停車中', speed: 0, lastUpdate: '1分前' },
    { id: 'T003', name: 'トラック003', driver: '伊藤次郎', lat: 35.6580, lng: 139.7016, status: '配送中', speed: 38, lastUpdate: '30秒前' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">GPS追跡</h1>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">リアルタイムマップ</h2>
              <div className="bg-gray-200 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">🗺️</p>
                  <p className="text-gray-600">Google Maps統合</p>
                  <p className="text-sm text-gray-500 mt-2">実際の地図はGoogle Maps APIで表示されます</p>
                </div>
              </div>
            </div>
          </div>

          {/* Truck List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">稼働中トラック</h2>
              <div className="space-y-4">
                {trucks.map((truck) => (
                  <div key={truck.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{truck.name}</h3>
                        <p className="text-sm text-gray-500">{truck.driver}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        truck.speed > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {truck.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">速度:</span>
                        <span className="font-medium">{truck.speed} km/h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">位置:</span>
                        <span className="font-medium text-xs">
                          {truck.lat.toFixed(4)}, {truck.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">更新:</span>
                        <span className="font-medium">{truck.lastUpdate}</span>
                      </div>
                    </div>
                    <button className="mt-3 w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg transition duration-200 text-sm font-medium">
                      詳細を表示
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">稼働中</div>
            <div className="text-3xl font-bold text-green-600">{trucks.filter(t => t.speed > 0).length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">停車中</div>
            <div className="text-3xl font-bold text-gray-600">{trucks.filter(t => t.speed === 0).length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">平均速度</div>
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(trucks.reduce((sum, t) => sum + t.speed, 0) / trucks.length)} km/h
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">総走行距離</div>
            <div className="text-3xl font-bold text-purple-600">245 km</div>
          </div>
        </div>
      </main>
    </div>
  );
}
