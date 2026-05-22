'use client';

import { useState, useEffect } from 'react';
import { getDatabase } from '@/lib/database';
import type { Customer } from '@/lib/database';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    contact: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    const db = getDatabase();
    setCustomers(db.getAllCustomers());
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({ code: '', name: '', address: '', phone: '', contact: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      code: customer.code,
      name: customer.name,
      address: customer.address,
      phone: customer.phone,
      contact: customer.contact || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('この顧客を削除しますか? 配送記録がある場合は削除できません。')) {
      const db = getDatabase();
      const result = db.deleteCustomer(id);
      if (result) {
        loadCustomers();
      } else {
        alert('この顧客には配送記録があるため削除できません。');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const db = getDatabase();

    const customerData = {
      code: formData.code,
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      contact: formData.contact || undefined
    };

    if (editingCustomer) {
      db.updateCustomer(editingCustomer.id, customerData);
    } else {
      db.addCustomer(customerData);
    }

    setIsModalOpen(false);
    loadCustomers();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">顧客マスタ</h2>
        <button
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition-colors"
        >
          + 新規顧客登録
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-blue-500 text-white">
              <th className="p-3 text-left border border-gray-300">顧客コード</th>
              <th className="p-3 text-left border border-gray-300">顧客名</th>
              <th className="p-3 text-left border border-gray-300">住所</th>
              <th className="p-3 text-left border border-gray-300">電話番号</th>
              <th className="p-3 text-left border border-gray-300">担当者</th>
              <th className="p-3 text-left border border-gray-300">操作</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 border border-gray-300">{customer.code}</td>
                <td className="p-3 border border-gray-300">{customer.name}</td>
                <td className="p-3 border border-gray-300">{customer.address}</td>
                <td className="p-3 border border-gray-300">{customer.phone}</td>
                <td className="p-3 border border-gray-300">{customer.contact || '-'}</td>
                <td className="p-3 border border-gray-300">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
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
                  {editingCustomer ? '顧客編集' : '新規顧客登録'}
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
                      顧客コード *
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      顧客名 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      住所 *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      電話番号 *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      担当者
                    </label>
                    <input
                      type="text"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
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
