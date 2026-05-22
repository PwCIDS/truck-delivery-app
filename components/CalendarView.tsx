'use client';

import type { Delivery, Truck, Customer } from '@/lib/database';

interface CalendarViewProps {
  deliveries: Delivery[];
  trucks: Truck[];
  customers: Customer[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onEditDelivery: (delivery: Delivery) => void;
  onAddDelivery: () => void;
}

export default function CalendarView({
  deliveries,
  trucks,
  customers,
  currentMonth,
  onMonthChange,
  onEditDelivery,
  onAddDelivery
}: CalendarViewProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(month - 1);
    onMonthChange(newDate);
  };

  const nextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(month + 1);
    onMonthChange(newDate);
  };

  const getDayOfWeek = (day: number) => {
    const date = new Date(year, month, day);
    return ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
  };

  const getDeliveriesForDate = (truckId: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const currentDate = new Date(dateStr);

    return deliveries.filter(d => {
      if (d.truckId !== truckId) return false;
      const startDate = new Date(d.startDate);
      const endDate = new Date(d.endDate);
      return currentDate >= startDate && currentDate <= endDate;
    });
  };

  return (
    <div className="mt-6">
      <div className="flex justify-center items-center gap-6 mb-6">
        <button
          onClick={prevMonth}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          &lt;
        </button>
        <span className="text-xl font-bold">
          {year}年 {month + 1}月
        </span>
        <button
          onClick={nextMonth}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          &gt;
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="bg-blue-500 text-white p-3 border border-gray-300 sticky left-0 z-10">
                日付
              </th>
              {trucks.map(truck => (
                <th key={truck.id} className="bg-blue-500 text-white p-2 border border-gray-300 text-sm">
                  {truck.number}<br />
                  <span className="text-xs font-normal">{truck.plate}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
              <tr key={day}>
                <td className="bg-slate-700 text-white p-3 border border-gray-300 font-bold sticky left-0 z-10">
                  {day}日<br />
                  <span className="text-sm font-normal">({getDayOfWeek(day)})</span>
                </td>
                {trucks.map(truck => {
                  const dayDeliveries = getDeliveriesForDate(truck.id, day);
                  const delivery = dayDeliveries[0];

                  if (delivery) {
                    const customer = customers.find(c => c.id === delivery.customerId);
                    const destText = delivery.destinations?.[0] || '';

                    return (
                      <td
                        key={truck.id}
                        className="bg-blue-500 text-white p-2 border border-gray-300 cursor-pointer hover:bg-blue-600 transition-colors"
                        onClick={() => onEditDelivery(delivery)}
                      >
                        <div className="text-xs leading-tight">
                          <div className="font-semibold">{customer?.name}</div>
                          <div>{destText}</div>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={truck.id}
                      className="p-2 border border-gray-300 cursor-pointer hover:bg-blue-50 transition-colors min-h-[60px]"
                      onClick={onAddDelivery}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
