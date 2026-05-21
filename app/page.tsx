'use client';

import { useState } from 'react';
import DeliveryManagement from '@/components/DeliveryManagement';
import TruckManagement from '@/components/TruckManagement';
import CustomerManagement from '@/components/CustomerManagement';

type Section = 'delivery' | 'trucks' | 'customers';

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>('delivery');

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <header className="bg-slate-800 text-white rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-4">トラック配送管理システム</h1>
          <nav className="flex gap-3">
            <button
              onClick={() => setActiveSection('delivery')}
              className={`px-5 py-2.5 rounded-md border-2 transition-all ${
                activeSection === 'delivery'
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-transparent border-white/30 hover:bg-white/10'
              }`}
            >
              配送管理
            </button>
            <button
              onClick={() => setActiveSection('trucks')}
              className={`px-5 py-2.5 rounded-md border-2 transition-all ${
                activeSection === 'trucks'
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-transparent border-white/30 hover:bg-white/10'
              }`}
            >
              トラックマスタ
            </button>
            <button
              onClick={() => setActiveSection('customers')}
              className={`px-5 py-2.5 rounded-md border-2 transition-all ${
                activeSection === 'customers'
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-transparent border-white/30 hover:bg-white/10'
              }`}
            >
              顧客マスタ
            </button>
          </nav>
        </header>

        <main className="bg-white rounded-lg shadow-lg p-8">
          {activeSection === 'delivery' && <DeliveryManagement />}
          {activeSection === 'trucks' && <TruckManagement />}
          {activeSection === 'customers' && <CustomerManagement />}
        </main>
      </div>
    </div>
  );
}
