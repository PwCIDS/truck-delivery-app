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
            this.deliveries = this.generateSampleDeliveries();
            this.saveData('deliveries', this.deliveries);
        }
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    generateSampleDeliveries() {
        const deliveries = [];
        let id = 1;
        const currentYear = new Date().getFullYear();

        const destinations = [
            ['東京都千代田区'],
            ['東京都港区', '東京都品川区'],
            ['神奈川県横浜市'],
            ['神奈川県川崎市', '神奈川県横浜市'],
            ['埼玉県さいたま市'],
            ['千葉県千葉市', '千葉県船橋市'],
            ['静岡県静岡市'],
            ['愛知県名古屋市'],
            ['大阪府大阪市'],
            ['福岡県福岡市'],
            ['東京都新宿区', '東京都渋谷区', '東京都世田谷区'],
            ['神奈川県相模原市'],
            ['千葉県柏市'],
            ['埼玉県川口市', '埼玉県越谷市']
        ];

        const cargoTypes = [
            '電化製品 500kg',
            '食品 800kg',
            '衣料品 300kg',
            '建材 1200kg',
            '医薬品 200kg',
            '精密機器 400kg',
            '日用品 600kg',
            '書籍 350kg',
            '家具 900kg',
            '工業部品 750kg',
            '飲料 1000kg',
            '冷凍食品 650kg',
            '化学製品 550kg',
            '文房具 250kg',
            'OA機器 450kg'
        ];

        // 4月のデータ（30日分）
        for (let day = 1; day <= 30; day++) {
            const deliveriesPerDay = Math.floor(Math.random() * 3) + 2; // 2-4件/日

            for (let i = 0; i < deliveriesPerDay; i++) {
                const truckId = (id % 3) + 1;
                const customerId = (id % 3) + 1;
                const startHour = 8 + Math.floor(Math.random() * 3);
                const duration = Math.floor(Math.random() * 5) + 4; // 4-8時間
                const isMultiDay = Math.random() > 0.8;

                const startDate = new Date(currentYear, 3, day); // 3 = April (0-indexed)
                const endDate = isMultiDay ? new Date(currentYear, 3, day + 1) : startDate;

                deliveries.push({
                    id: id++,
                    truckId,
                    customerId,
                    startDate: this.formatDate(startDate),
                    startTime: `${String(startHour).padStart(2, '0')}:00`,
                    endDate: this.formatDate(endDate),
                    endTime: `${String((startHour + duration) % 24).padStart(2, '0')}:00`,
                    destinations: destinations[Math.floor(Math.random() * destinations.length)],
                    cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
                    status: 'completed'
                });
            }
        }

        // 5月のデータ（31日分）
        for (let day = 1; day <= 31; day++) {
            const deliveriesPerDay = Math.floor(Math.random() * 4) + 2; // 2-5件/日

            for (let i = 0; i < deliveriesPerDay; i++) {
                const truckId = (id % 3) + 1;
                const customerId = (id % 3) + 1;
                const startHour = 7 + Math.floor(Math.random() * 4);
                const duration = Math.floor(Math.random() * 6) + 4; // 4-9時間
                const isMultiDay = Math.random() > 0.75;

                const startDate = new Date(currentYear, 4, day); // 4 = May
                const endDate = isMultiDay ? new Date(currentYear, 4, day + 1) : startDate;

                deliveries.push({
                    id: id++,
                    truckId,
                    customerId,
                    startDate: this.formatDate(startDate),
                    startTime: `${String(startHour).padStart(2, '0')}:00`,
                    endDate: this.formatDate(endDate),
                    endTime: `${String((startHour + duration) % 24).padStart(2, '0')}:00`,
                    destinations: destinations[Math.floor(Math.random() * destinations.length)],
                    cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
                    status: 'completed'
                });
            }
        }

        // 6月のデータ（現在の日付まで + 未来の予定）
        const today = new Date();
        const currentDay = today.getMonth() === 5 ? today.getDate() : 30;

        for (let day = 1; day <= 30; day++) {
            const deliveriesPerDay = Math.floor(Math.random() * 4) + 2; // 2-5件/日

            for (let i = 0; i < deliveriesPerDay; i++) {
                const truckId = (id % 3) + 1;
                const customerId = (id % 3) + 1;
                const startHour = 7 + Math.floor(Math.random() * 5);
                const duration = Math.floor(Math.random() * 6) + 4; // 4-9時間
                const isMultiDay = Math.random() > 0.8;

                const startDate = new Date(currentYear, 5, day); // 5 = June
                const endDate = isMultiDay ? new Date(currentYear, 5, day + 1) : startDate;

                let status;
                if (day < currentDay - 1) {
                    status = 'completed';
                } else if (day === currentDay - 1 || day === currentDay) {
                    status = Math.random() > 0.5 ? 'inprogress' : 'completed';
                } else {
                    status = 'scheduled';
                }

                deliveries.push({
                    id: id++,
                    truckId,
                    customerId,
                    startDate: this.formatDate(startDate),
                    startTime: `${String(startHour).padStart(2, '0')}:00`,
                    endDate: this.formatDate(endDate),
                    endTime: `${String((startHour + duration) % 24).padStart(2, '0')}:00`,
                    destinations: destinations[Math.floor(Math.random() * destinations.length)],
                    cargo: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
                    status
                });
            }
        }

        return deliveries;
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
