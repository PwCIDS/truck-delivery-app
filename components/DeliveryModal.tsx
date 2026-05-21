'use client';

import { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database';
import type { Delivery, Truck, Customer } from '@/lib/database';
import SearchableSelect from './SearchableSelect';

interface DeliveryModalProps {
  delivery: Delivery | null;
  trucks: Truck[];
  customers: Customer[];
  onClose: () => void;
  onSave: () => void;
}

export default function DeliveryModal({
  delivery,
  trucks,
  customers,
  onClose,
  onSave
}: DeliveryModalProps) {
  const [truckId, setTruckId] = useState<number | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [destinations, setDestinations] = useState<string[]>([]);
  const [destinationInput, setDestinationInput] = useState('');
  const [cargo, setCargo] = useState('');

  useEffect(() => {
    if (delivery) {
      setTruckId(delivery.truckId);
      setCustomerId(delivery.customerId);
      setStartDate(delivery.startDate);
      setStartTime(delivery.startTime);
      setEndDate(delivery.endDate);
      setEndTime(delivery.endTime);
      setDestinations([...delivery.destinations]);
      setCargo(delivery.cargo);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
    }
  }, [delivery]);

  const handleAddDestination = () => {
    if (destinationInput.trim()) {
      setDestinations([...destinations, destinationInput.trim()]);
      setDestinationInput('');
    }
  };

  const handleRemoveDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!truckId || !customerId) {
      alert('トラックと顧客を選択してください。');
      return;
    }

    if (destinations.length === 0) {
      alert('行先を少なくとも1つ追加してください。');
      return;
    }

    const startDateTime = new Date(startDate + ' ' + startTime);
    const endDateTime = new Date(endDate + ' ' + endTime);

    if (endDateTime <= startDateTime) {
      alert('到着日時は出発日時より後に設定してください。');
      return;
    }

    const db = getDatabase();
    const isAvailable = db.isTruckAvailable(
      truckId,
      startDate,
      startTime,
      endDate,
      endTime,
      delivery?.id
    );

    if (!isAvailable) {
      alert('選択したトラックは指定の日時で既に予約されています。別のトラックまたは時間を選択してください。');
      return;
    }

    const deliveryData = {
      truckId,
      customerId,
      startDate,
      startTime,
      endDate,
      endTime,
      destinations: [...destinations],
      cargo
    };

    if (delivery) {
      db.updateDelivery(delivery.id, deliveryData);
    } else {
      db.addDelivery(deliveryData);
    }

    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {delivery ? '配送編集' : '新規配送登録'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <SearchableSelect
                label="トラック"
                items={trucks}
                selectedId={truckId}
                onSelect={setTruckId}
                getDisplayText={(truck) => `${truck.number} - ${truck.plate} (${truck.capacity}kg)`}
                getSearchText={(truck) => `${truck.number} ${truck.plate}`}
                placeholder="トラックを検索..."
              />

              <SearchableSelect
                label="顧客"
                items={customers}
                selectedId={customerId}
                onSelect={setCustomerId}
                getDisplayText={(customer) => `${customer.code} - ${customer.name}`}
                getSearchText={(customer) => `${customer.code} ${customer.name} ${customer.address}`}
                placeholder="顧客を検索..."
              />

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  出発日時 *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  到着日時 *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  行先 *
                </label>
                {destinations.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {destinations.map((dest, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 p-3 rounded-lg border border-gray-300"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-blue-500 min-w-[30px]">
                            {index + 1}.
                          </span>
                          <span>{dest}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDestination(index)}
                          className="text-red-500 hover:text-red-700 text-xl"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDestination())}
                    placeholder="行先を入力..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddDestination}
                    className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    + 追加
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  積載内容 *
                </label>
                <textarea
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
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
  );
}
