'use client';

import { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database';
import type { Delivery, Truck, Customer } from '@/lib/database';
import DeliveryModal from './DeliveryModal';
import CalendarView from './CalendarView';
import ListView from './ListView';

export default function DeliveryManagement() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const db = getDatabase();
    setDeliveries(db.getAllDeliveries());
    setTrucks(db.getAllTrucks());
    setCustomers(db.getAllCustomers());
  };

  const handleAddDelivery = () => {
    setEditingDelivery(null);
    setIsModalOpen(true);
  };

  const handleEditDelivery = (delivery: Delivery) => {
    setEditingDelivery(delivery);
    setIsModalOpen(true);
  };

  const handleDeleteDelivery = (id: number) => {
    if (confirm('この配送を削除しますか?')) {
      const db = getDatabase();
      db.deleteDelivery(id);
      loadData();
    }
  };

  const handleSaveDelivery = () => {
    setIsModalOpen(false);
    loadData();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800">配送管理</h2>
        <div className="flex gap-3">
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-md transition-all ${
                view === 'calendar'
                  ? 'bg-blue-500 text-white'
                  : 'bg-transparent text-gray-700 hover:bg-gray-300'
              }`}
            >
              カレンダー表示
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-md transition-all ${
                view === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-transparent text-gray-700 hover:bg-gray-300'
              }`}
            >
              リスト表示
            </button>
          </div>
          <button
            onClick={handleAddDelivery}
            className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition-colors"
          >
            + 新規配送登録
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView
          deliveries={deliveries}
          trucks={trucks}
          customers={customers}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          onEditDelivery={handleEditDelivery}
          onAddDelivery={handleAddDelivery}
        />
      ) : (
        <ListView
          deliveries={deliveries}
          trucks={trucks}
          customers={customers}
          onEditDelivery={handleEditDelivery}
          onDeleteDelivery={handleDeleteDelivery}
        />
      )}

      {isModalOpen && (
        <DeliveryModal
          delivery={editingDelivery}
          trucks={trucks}
          customers={customers}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveDelivery}
        />
      )}
    </div>
  );
}
