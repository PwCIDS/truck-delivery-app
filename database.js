class Database {
    constructor() {
        this.deliveries = this.loadData('deliveries') || [];
        this.trucks = this.loadData('trucks') || [];
        this.customers = this.loadData('customers') || [];
        this.initSampleData();
    }

    loadData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    initSampleData() {
        if (this.trucks.length === 0) {
            this.trucks = [
                { id: 1, number: 'T-001', plate: '品川 500 あ 1234', capacity: 2000, purchaseDate: '2023-01-15', status: 'available' },
                { id: 2, number: 'T-002', plate: '品川 500 あ 5678', capacity: 3000, purchaseDate: '2023-03-20', status: 'available' },
                { id: 3, number: 'T-003', plate: '品川 500 い 9012', capacity: 4000, purchaseDate: '2023-06-10', status: 'available' }
            ];
            this.saveData('trucks', this.trucks);
        }

        if (this.customers.length === 0) {
            this.customers = [
                { id: 1, code: 'C-001', name: '株式会社サンプル商事', address: '東京都千代田区丸の内1-1-1', phone: '03-1234-5678', contact: '山田太郎' },
                { id: 2, code: 'C-002', name: '有限会社テスト物産', address: '神奈川県横浜市西区みなとみらい2-2-2', phone: '045-9876-5432', contact: '佐藤花子' },
                { id: 3, code: 'C-003', name: 'デモ株式会社', address: '大阪府大阪市北区梅田3-3-3', phone: '06-5555-1111', contact: '鈴木一郎' }
            ];
            this.saveData('customers', this.customers);
        }

        if (this.deliveries.length === 0) {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);

            this.deliveries = [
                {
                    id: 1,
                    truckId: 1,
                    customerId: 1,
                    startDate: this.formatDate(today),
                    startTime: '09:00',
                    endDate: this.formatDate(today),
                    endTime: '17:00',
                    destinations: ['東京都千代田区'],
                    cargo: '電化製品 500kg',
                    status: 'inprogress'
                },
                {
                    id: 2,
                    truckId: 2,
                    customerId: 2,
                    startDate: this.formatDate(tomorrow),
                    startTime: '08:00',
                    endDate: this.formatDate(dayAfter),
                    endTime: '18:00',
                    destinations: ['神奈川県横浜市', '静岡県静岡市'],
                    cargo: '食品 800kg',
                    status: 'scheduled'
                }
            ];
            this.saveData('deliveries', this.deliveries);
        }
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getAllDeliveries() {
        return this.deliveries;
    }

    getDeliveryById(id) {
        return this.deliveries.find(d => d.id === id);
    }

    addDelivery(delivery) {
        const newId = this.deliveries.length > 0 ? Math.max(...this.deliveries.map(d => d.id)) + 1 : 1;
        delivery.id = newId;
        delivery.status = this.getDeliveryStatus(delivery.startDate, delivery.startTime, delivery.endDate, delivery.endTime);
        this.deliveries.push(delivery);
        this.saveData('deliveries', this.deliveries);
        return delivery;
    }

    updateDelivery(id, updatedDelivery) {
        const index = this.deliveries.findIndex(d => d.id === id);
        if (index !== -1) {
            updatedDelivery.id = id;
            if (updatedDelivery.manualStatus) {
                updatedDelivery.status = updatedDelivery.manualStatus;
            } else {
                updatedDelivery.status = this.getDeliveryStatus(updatedDelivery.startDate, updatedDelivery.startTime, updatedDelivery.endDate, updatedDelivery.endTime);
            }
            this.deliveries[index] = updatedDelivery;
            this.saveData('deliveries', this.deliveries);
            return true;
        }
        return false;
    }

    deleteDelivery(id) {
        const index = this.deliveries.findIndex(d => d.id === id);
        if (index !== -1) {
            this.deliveries.splice(index, 1);
            this.saveData('deliveries', this.deliveries);
            return true;
        }
        return false;
    }

    getDeliveryStatus(startDate, startTime, endDate, endTime) {
        const now = new Date();

        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        const startDateTime = new Date(startDate);
        startDateTime.setHours(startHour, startMinute);

        const endDateTime = new Date(endDate);
        endDateTime.setHours(endHour, endMinute);

        if (now < startDateTime) {
            return 'scheduled';
        } else if (now >= startDateTime && now <= endDateTime) {
            return 'inprogress';
        } else {
            return 'completed';
        }
    }

    isTruckAvailable(truckId, startDate, startTime, endDate, endTime, excludeDeliveryId = null) {
        const [newStartHour, newStartMinute] = startTime.split(':').map(Number);
        const [newEndHour, newEndMinute] = endTime.split(':').map(Number);

        const newStartDateTime = new Date(startDate);
        newStartDateTime.setHours(newStartHour, newStartMinute, 0, 0);

        const newEndDateTime = new Date(endDate);
        newEndDateTime.setHours(newEndHour, newEndMinute, 0, 0);

        const deliveries = this.deliveries.filter(d => {
            if (excludeDeliveryId && d.id === excludeDeliveryId) {
                return false;
            }
            return d.truckId === truckId;
        });

        for (const delivery of deliveries) {
            const [existingStartHour, existingStartMinute] = delivery.startTime.split(':').map(Number);
            const [existingEndHour, existingEndMinute] = delivery.endTime.split(':').map(Number);

            const existingStartDateTime = new Date(delivery.startDate);
            existingStartDateTime.setHours(existingStartHour, existingStartMinute, 0, 0);

            const existingEndDateTime = new Date(delivery.endDate);
            existingEndDateTime.setHours(existingEndHour, existingEndMinute, 0, 0);

            if (!(newEndDateTime <= existingStartDateTime || newStartDateTime >= existingEndDateTime)) {
                return false;
            }
        }

        return true;
    }

    getAllTrucks() {
        return this.trucks;
    }

    getTruckById(id) {
        return this.trucks.find(t => t.id === id);
    }

    addTruck(truck) {
        const newId = this.trucks.length > 0 ? Math.max(...this.trucks.map(t => t.id)) + 1 : 1;
        truck.id = newId;
        truck.status = 'available';
        this.trucks.push(truck);
        this.saveData('trucks', this.trucks);
        return truck;
    }

    updateTruck(id, updatedTruck) {
        const index = this.trucks.findIndex(t => t.id === id);
        if (index !== -1) {
            updatedTruck.id = id;
            updatedTruck.status = this.trucks[index].status;
            this.trucks[index] = updatedTruck;
            this.saveData('trucks', this.trucks);
            return true;
        }
        return false;
    }

    deleteTruck(id) {
        const hasDeliveries = this.deliveries.some(d => d.truckId === id);
        if (hasDeliveries) {
            return false;
        }

        const index = this.trucks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.trucks.splice(index, 1);
            this.saveData('trucks', this.trucks);
            return true;
        }
        return false;
    }

    getAllCustomers() {
        return this.customers;
    }

    getCustomerById(id) {
        return this.customers.find(c => c.id === id);
    }

    addCustomer(customer) {
        const newId = this.customers.length > 0 ? Math.max(...this.customers.map(c => c.id)) + 1 : 1;
        customer.id = newId;
        this.customers.push(customer);
        this.saveData('customers', this.customers);
        return customer;
    }

    updateCustomer(id, updatedCustomer) {
        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
            updatedCustomer.id = id;
            this.customers[index] = updatedCustomer;
            this.saveData('customers', this.customers);
            return true;
        }
        return false;
    }

    deleteCustomer(id) {
        const hasDeliveries = this.deliveries.some(d => d.customerId === id);
        if (hasDeliveries) {
            return false;
        }

        const index = this.customers.findIndex(c => c.id === id);
        if (index !== -1) {
            this.customers.splice(index, 1);
            this.saveData('customers', this.customers);
            return true;
        }
        return false;
    }
}
