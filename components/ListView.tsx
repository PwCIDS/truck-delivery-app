'use client';

import { useState } from 'react';
import type { Delivery, Truck, Customer } from '@/lib/database';

interface ListViewProps {
  deliveries: Delivery[];
  trucks: Truck[];
  customers: Customer[];
  onEditDelivery: (delivery: Delivery) => void;
  onDeleteDelivery: (id: number) => void;
}

export default function ListView({
  deliveries,
  trucks,
  customers,
  onEditDelivery,
  onDeleteDelivery
}: ListViewProps) {
  const [searchText, setSearchText] = useState('');
  const [filterTruckId, setFilterTruckId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState('');

  const statusLabels = {
    scheduled: '予定',
    inprogress: '運転中',
    completed: '完了'
  };

  const filteredDeliveries = deliveries
    .filter(delivery => {
      if (searchText) {
        const truck = trucks.find(t => t.id === delivery.truckId);
        const customer = customers.find(c => c.id === delivery.customerId);
        const searchLower = searchText.toLowerCase();

        const matchTruck = truck?.number.toLowerCase().includes(searchLower);
        const matchCustomer = customer?.name.toLowerCase().includes(searchLower);
        const matchDest = delivery.destinations.some(d => d.toLowerCase().includes(searchLower));
        const matchCargo = delivery.cargo.toLowerCase().includes(searchLower);

        if (!matchTruck && !matchCustomer && !matchDest && !matchCargo) {
          return false;
        }
      }

      if (filterTruckId && delivery.truckId !== filterTruckId) {
        return false;
      }

      if (filterStatus && delivery.status !== filterStatus) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.startDate + ' ' + a.startTime);
      const dateB = new Date(b.startDate + ' ' + b.startTime);
      return dateB.getTime() - dateA.getTime();
    });

  return (
    <div>
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="検索..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterTruckId || ''}
          onChange={(e) => setFilterTruckId(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全てのトラック</option>
          {trucks.map(truck => (
            <option key={truck.id} value={truck.id}>
              {truck.number} - {truck.plate}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">全てのステータス</option>
          <option value="scheduled">予定</option>
          <option value="inprogress">運転中</option>
          <option value="completed">完了</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="p-3 text-left border border-gray-300">出発日時</th>
              <th className="p-3 text-left border border-gray-300">到着日時</th>
              <th className="p-3 text-left border border-gray-300">トラック</th>
              <th className="p-3 text-left border border-gray-300">顧客</th>
              <th className="p-3 text-left border border-gray-300">行先</th>
              <th className="p-3 text-left border border-gray-300">積載内容</th>
              <th className="p-3 text-left border border-gray-300">ステータス</th>
              <th className="p-3 text-left border border-gray-300">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeliveries.map(delivery => {
              const truck = trucks.find(t => t.id === delivery.truckId);
              const customer = customers.find(c => c.id === delivery.customerId);
              const destText = delivery.destinations.join(' → ');

              return (
                <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 border border-gray-300">
                    {delivery.startDate} {delivery.startTime}
                  </td>
                  <td className="p-3 border border-gray-300">
                    {delivery.endDate} {delivery.endTime}
                  </td>
                  <td className="p-3 border border-gray-300">{truck?.number}</td>
                  <td className="p-3 border border-gray-300">{customer?.name}</td>
                  <td className="p-3 border border-gray-300">{destText}</td>
                  <td className="p-3 border border-gray-300">{delivery.cargo}</td>
                  <td className="p-3 border border-gray-300">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        delivery.status === 'scheduled'
                          ? 'bg-orange-500 text-white'
                          : delivery.status === 'inprogress'
                          ? 'bg-blue-500 text-white'
                          : 'bg-green-500 text-white'
                      }`}
                    >
                      {statusLabels[delivery.status]}
                    </span>
                  </td>
                  <td className="p-3 border border-gray-300">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditDelivery(delivery)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => onDeleteDelivery(delivery.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
