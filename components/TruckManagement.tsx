'use client';

import { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database';
import type { Truck } from '@/lib/database';

export default function TruckManagement() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [formData, setFormData] = useState({
    number: '',
    plate: '',
    capacity: '',
    purchaseDate: ''
  });

  useEffect(() => {
    loadTrucks();
  }, []);

  const loadTrucks = () => {
    const db = getDatabase();
    setTrucks(db.getAllTrucks());
  };

  const handleAdd = () => {
    setEditingTruck(null);
    setFormData({ number: '', plate: '', capacity: '', purchaseDate: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck);
    setFormData({
      number: truck.number,
      plate: truck.plate,
      capacity: truck.capacity.toString(),
      purchaseDate: truck.purchaseDate
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('このトラックを削除しますか? 配送記録がある場合は削除できません。')) {
      const db = getDatabase();
      const result = db.deleteTruck(id);
      if (result) {
        loadTrucks();
      } else {
        alert('このトラックには配送記録があるため削除できません。');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDatabase();

    const truckData = {
      number: formData.number,
      plate: formData.plate,
      capacity: parseInt(formData.capacity),
      purchaseDate: formData.purchaseDate
    };

    if (editingTruck) {
      db.updateTruck(editingTruck.id, truckData);
    } else {
      db.addTruck(truckData);
    }

    setIsModalOpen(false);
    loadTrucks();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">トラックマスタ</h2>
        <button
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition-colors"
        >
          + 新規トラック登録
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="p-3 text-left border border-gray-300">トラックNo</th>
              <th className="p-3 text-left border border-gray-300">車両番号</th>
              <th className="p-3 text-left border border-gray-300">最大積載量</th>
              <th className="p-3 text-left border border-gray-300">購入日</th>
              <th className="p-3 text-left border border-gray-300">ステータス</th>
              <th className="p-3 text-left border border-gray-300">操作</th>
            </tr>
          </thead>
          <tbody>
            {trucks.map(truck => (
              <tr key={truck.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 border border-gray-300">{truck.number}</td>
                <td className="p-3 border border-gray-300">{truck.plate}</td>
                <td className="p-3 border border-gray-300">{truck.capacity} kg</td>
                <td className="p-3 border border-gray-300">{truck.purchaseDate}</td>
                <td className="p-3 border border-gray-300">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      truck.status === 'available'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {truck.status === 'available' ? '利用可能' : '使用中'}
                  </span>
                </td>
                <td className="p-3 border border-gray-300">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(truck)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(truck.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingTruck ? 'トラック編集' : '新規トラック登録'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      トラックNo *
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      車両番号 *
                    </label>
                    <input
                      type="text"
                      value={formData.plate}
                      onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                      placeholder="例: 品川 500 あ 1234"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      最大積載量 (kg) *
                    </label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      購入日 *
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition-colors"
                  >
                    登録
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
